import type { H3Event } from 'h3'
import { UAParser } from 'ua-parser-js'
import type { GeoInfo, Hit, UAInfo } from './types'

const BOT_UA_PATTERNS = [
  'bot', 'crawl', 'spider', 'slurp', 'curl', 'wget', 'python-requests',
  'python-urllib', 'go-http-client', 'java/', 'okhttp', 'libwww', 'httpclient',
  'headless', 'phantomjs', 'puppeteer', 'playwright', 'scrapy', 'axios',
  'node-fetch', 'postmanruntime', 'insomnia', 'facebookexternalhit',
  'whatsapp', 'telegrambot', 'slackbot', 'discordbot', 'twitterbot',
  'linkedinbot', 'embedly', 'google-safety', 'bingpreview', 'preview'
]

function getClientIps(event: H3Event): string[] {
  const headers = getRequestHeaders(event)
  const chain: string[] = []

  const fwd = headers['x-forwarded-for']
  if (fwd) chain.push(...fwd.split(',').map((s) => s.trim()).filter(Boolean))

  for (const h of ['cf-connecting-ip', 'x-real-ip', 'true-client-ip', 'fastly-client-ip']) {
    const v = headers[h]
    if (v && !chain.includes(v)) chain.push(v)
  }

  const remote = event.node.req.socket?.remoteAddress
  if (remote && !chain.includes(remote)) chain.push(remote)

  return chain.length ? chain : ['unknown']
}

function parseUa(uaString?: string): UAInfo {
  if (!uaString) return {}
  const r = UAParser(uaString)
  return {
    browser: r.browser.name,
    browserVersion: r.browser.version,
    os: r.os.name,
    osVersion: r.os.version,
    device: [r.device.vendor, r.device.model].filter(Boolean).join(' ') || undefined,
    deviceType: r.device.type || 'desktop',
    engine: r.engine.name
  }
}

function detectBot(uaString: string | undefined, headers: Record<string, string>): { isBot: boolean; reason?: string } {
  if (!uaString) return { isBot: true, reason: 'Missing User-Agent header' }
  const ua = uaString.toLowerCase()
  for (const p of BOT_UA_PATTERNS) {
    if (ua.includes(p)) return { isBot: true, reason: `User-Agent matches "${p}"` }
  }
  // Real browsers almost always send Accept-Language.
  if (!headers['accept-language']) return { isBot: true, reason: 'No Accept-Language header' }
  // Real browsers send an Accept header for navigations.
  if (!headers['accept']) return { isBot: true, reason: 'No Accept header' }
  return { isBot: false }
}

function isPrivateIp(ip: string): boolean {
  return /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fe80:|fc00:|localhost|unknown)/i.test(ip)
}

async function geoLookup(ip: string): Promise<GeoInfo | undefined> {
  if (isPrivateIp(ip)) return undefined
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 2500)
    const res = await $fetch<any>(`http://ip-api.com/json/${encodeURIComponent(ip)}`, {
      query: { fields: 'status,country,countryCode,regionName,city,isp,org,as,lat,lon' },
      signal: controller.signal
    }).finally(() => clearTimeout(t))
    if (!res || res.status !== 'success') return undefined
    return {
      country: res.country,
      countryCode: res.countryCode,
      region: res.regionName,
      city: res.city,
      isp: res.isp,
      org: res.org,
      asn: res.as,
      lat: res.lat,
      lon: res.lon
    }
  } catch {
    return undefined
  }
}

/**
 * Build a full Hit record from the incoming request. This is where all the
 * juicy honeypot metadata gets collected.
 */
export async function buildHit(event: H3Event): Promise<Omit<Hit, 'id' | 'trapId'>> {
  const headers = getRequestHeaders(event) as Record<string, string>
  const ipChain = getClientIps(event)
  const ip = ipChain[0]
  const userAgent = headers['user-agent']
  const bot = detectBot(userAgent, headers)

  const geo = useRuntimeConfig(event).geoLookup ? await geoLookup(ip) : undefined

  return {
    ts: Date.now(),
    ip,
    ipChain,
    method: event.method,
    host: headers['host'] || '',
    path: event.path,
    query: getQuery(event) as Record<string, string>,
    referer: headers['referer'] || headers['referrer'],
    userAgent,
    acceptLanguage: headers['accept-language'],
    ua: parseUa(userAgent),
    geo,
    isBot: bot.isBot,
    botReason: bot.reason,
    headers
  }
}
