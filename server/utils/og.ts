import type { CustomPreview, OgData, OgTag } from './types'

const FETCH_UA =
  'Mozilla/5.0 (compatible; hon.ey-link-preview/1.0; +https://github.com/) facebookexternalhit/1.1'

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
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': FETCH_UA, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
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
