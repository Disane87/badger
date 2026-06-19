import { Resolver } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { CustomPreview, OgData, OgTag } from './types'

const FETCH_UA =
  'Mozilla/5.0 (compatible; hon.ey-link-preview/1.0; +https://github.com/) facebookexternalhit/1.1'

const resolver = new Resolver()

/**
 * Reject loopback, link-local, cloud-metadata, and RFC1918 ranges so a malicious
 * trap target cannot pivot fetchOgData into the host's internal network.
 */
function isPrivateAddress(addr: string): boolean {
  const v = isIP(addr)
  if (v === 4) {
    const [a, b] = addr.split('.').map(Number)
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true // link-local + AWS/GCP metadata
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    if (a >= 224) return true // multicast + reserved
    return false
  }
  if (v === 6) {
    const lower = addr.toLowerCase()
    if (lower === '::1' || lower === '::' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true
    if (lower.startsWith('::ffff:')) return isPrivateAddress(lower.slice(7))
    if (lower.startsWith('2001:db8:')) return true
    return false
  }
  return true
}

async function assertPublicHost(urlStr: string): Promise<void> {
  let parsed: URL
  try {
    parsed = new URL(urlStr)
  } catch {
    throw new Error('Invalid URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Refusing non-http(s) scheme: ${parsed.protocol}`)
  }
  const host = parsed.hostname
  if (!host) throw new Error('URL has no host')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error(`Refusing internal host: ${host}`)
  }

  const literal = isIP(host)
  if (literal) {
    if (isPrivateAddress(host)) throw new Error(`Refusing private IP: ${host}`)
    return
  }

  const addrs: string[] = []
  for (const fn of ['resolve4', 'resolve6'] as const) {
    try {
      const r = await resolver[fn](host)
      addrs.push(...r)
    } catch {}
  }
  if (!addrs.length) throw new Error(`Could not resolve host: ${host}`)
  for (const a of addrs) {
    if (isPrivateAddress(a)) throw new Error(`Host ${host} resolves to private address ${a}`)
  }
}

/**
 * Follow redirects manually so each hop's hostname can be re-validated against
 * the private-network blocklist. Native fetch with redirect:'follow' would let
 * an attacker bounce us from a public host into 169.254.169.254.
 */
async function safePublicFetch(url: string, init: RequestInit & { maxRedirects?: number }): Promise<Response> {
  const max = init.maxRedirects ?? 5
  let current = url
  const { maxRedirects: _omit, ...passthrough } = init
  for (let i = 0; i <= max; i++) {
    await assertPublicHost(current)
    const res = await fetch(current, { ...passthrough, redirect: 'manual' })
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return res
      current = new URL(loc, current).toString()
      continue
    }
    return res
  }
  throw new Error('Too many redirects')
}

/** Which meta tags are worth cloning for a link preview. */
function wantMeta(attr: 'property' | 'name', key: string): boolean {
  const k = key.toLowerCase()
  if (attr === 'property') return k.startsWith('og:') || k.startsWith('article:') || k.startsWith('twitter:')
  // name=
  return (
    k.startsWith('twitter:') ||
    k === 'description' ||
    k === 'theme-color' ||
    k === 'author' ||
    k === 'application-name'
  )
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/gi, '/')
}

function resolveUrl(value: string, base: string): string {
  try {
    return new URL(value, base).toString()
  } catch {
    return value
  }
}

/** Parse a single <meta ...> tag's attributes. */
function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const re = /([a-zA-Z:_-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s">]+))/g
  let m: RegExpExecArray | null
  while ((m = re.exec(tag))) {
    const name = m[1].toLowerCase()
    attrs[name] = m[3] ?? m[4] ?? m[5] ?? ''
  }
  return attrs
}

/**
 * Fetch a URL and extract the OpenGraph / Twitter-card / title metadata so the
 * honeypot link reproduces the same preview as the real target.
 */
export async function fetchOgData(targetUrl: string): Promise<OgData> {
  const base: OgData = { finalUrl: targetUrl, tags: [], fetchedAt: Date.now() }
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 8000)
    const res = await safePublicFetch(targetUrl, {
      headers: { 'User-Agent': FETCH_UA, Accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal
    }).finally(() => clearTimeout(t))

    base.finalUrl = res.url || targetUrl
    if (!res.ok) {
      base.error = `Target responded ${res.status}`
      return base
    }
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('html')) {
      base.error = `Target is not HTML (${ct || 'unknown'})`
      return base
    }

    // Only read the <head>-ish portion to keep it light.
    const html = (await res.text()).slice(0, 600_000)

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    if (titleMatch) base.title = decodeEntities(titleMatch[1].trim())

    const tags: OgTag[] = []
    const metaRe = /<meta\b[^>]*>/gi
    let m: RegExpExecArray | null
    while ((m = metaRe.exec(html))) {
      const a = parseAttrs(m[0])
      const content = a.content
      if (content == null) continue
      let attr: 'property' | 'name' | null = null
      let key = ''
      if (a.property) { attr = 'property'; key = a.property }
      else if (a.name) { attr = 'name'; key = a.name }
      if (!attr || !wantMeta(attr, key)) continue

      let value = decodeEntities(content)
      // Resolve relative image / url references against the final URL.
      if (/(^og:image$|^og:url$|^twitter:image$|image$|url$)/i.test(key) && value && !/^https?:|^data:/i.test(value)) {
        value = resolveUrl(value, base.finalUrl)
      }
      tags.push({ attr, key, content: value })
    }

    // Canonical link
    const linkRe = /<link\b[^>]*>/gi
    while ((m = linkRe.exec(html))) {
      const a = parseAttrs(m[0])
      if ((a.rel || '').toLowerCase() === 'canonical' && a.href) {
        tags.push({ attr: 'link', key: 'canonical', content: resolveUrl(a.href, base.finalUrl) })
      }
    }

    base.tags = tags
    return base
  } catch (err: any) {
    base.error = err?.name === 'AbortError' ? 'Fetch timed out' : err?.message || 'Fetch failed'
    return base
  }
}

/**
 * Build OgData from user-authored fields (type=custom) — no network fetch.
 * Produces both OpenGraph and Twitter-card tags so the fake preview shows up
 * consistently across Slack, Discord, X, iMessage, etc.
 */
export function buildCustomOgData(fields: CustomPreview, finalUrl = ''): OgData {
  const tags: OgTag[] = []
  const push = (attr: 'property' | 'name', key: string, content?: string) => {
    if (content) tags.push({ attr, key, content })
  }
  push('property', 'og:title', fields.title)
  push('property', 'og:description', fields.description)
  push('property', 'og:image', fields.image)
  push('property', 'og:site_name', fields.siteName)
  push('property', 'og:type', 'website')
  push('name', 'description', fields.description)
  push('name', 'twitter:card', fields.image ? 'summary_large_image' : 'summary')
  push('name', 'twitter:title', fields.title)
  push('name', 'twitter:description', fields.description)
  push('name', 'twitter:image', fields.image)
  return { finalUrl, title: fields.title, tags, fetchedAt: Date.now() }
}

function esc(s: string): string {
  return s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]!))
}

const LOADING_BODY = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f5f6f8;color:#333;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
  <div style="text-align:center">
    <div style="width:34px;height:34px;border:3px solid #e3e6ea;border-top-color:#888;border-radius:50%;margin:0 auto 18px;animation:s 1s linear infinite"></div>
    <div style="font-weight:600">Preparing your document…</div>
  </div>
</div>
<style>@keyframes s{to{transform:rotate(360deg)}}</style>`

export interface PreviewRenderOptions {
  og?: OgData
  /** Inject an auto-forward to `target` (real humans only, never unfurlers) */
  redirect: boolean
  /** Forward destination when redirect is true */
  target?: string
  /** Raw operator-authored HTML body to show instead of a loading page */
  bodyHtml?: string
}

/**
 * Render the preview/landing page. Link-preview crawlers parse the meta tags in
 * <head>; real humans either get auto-forwarded (redirect) or see a body:
 * operator-authored custom HTML if provided, otherwise a neutral loading page.
 */
export function renderPreviewPage(opts: PreviewRenderOptions): string {
  const { og, redirect, target, bodyHtml } = opts
  const title = og?.title || 'Loading…'
  const metaTags = (og?.tags || [])
    .map((t) => {
      if (t.attr === 'link') return `<link rel="${esc(t.key)}" href="${esc(t.content)}">`
      return `<meta ${t.attr}="${esc(t.key)}" content="${esc(t.content)}">`
    })
    .join('\n')

  const redirectBits =
    redirect && target
      ? `<meta http-equiv="refresh" content="0; url=${esc(target)}">
<script>location.replace(${JSON.stringify(target)})<\/script>`
      : ''

  // Body: redirect notice > operator custom HTML > neutral loading page.
  const body =
    redirect && target
      ? `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;color:#555">
<p>Redirecting… <a href="${esc(target)}">Continue</a></p></div>`
      : bodyHtml && bodyHtml.trim()
        ? bodyHtml
        : LOADING_BODY

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
${metaTags}
${redirectBits}
</head>
<body>
${body}
</body>
</html>`
}
