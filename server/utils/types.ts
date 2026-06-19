export type TrapType = 'redirect' | 'decoy' | 'pixel' | 'clone' | 'custom'

/** User-authored link preview (for type=custom). */
export interface CustomPreview {
  title?: string
  description?: string
  image?: string
  siteName?: string
}

/** A single cloned <meta>/<title>/<link> tag, ready to be re-emitted. */
export interface OgTag {
  /** 'property' | 'name' | 'title' | 'link' */
  attr: string
  key: string
  content: string
}

export interface OgData {
  finalUrl: string
  title?: string
  tags: OgTag[]
  fetchedAt: number
  /** Set if the last fetch failed */
  error?: string
}

export interface Trap {
  id: string
  slug: string
  name: string
  type: TrapType
  /** Redirect / clone / custom forward target (optional for custom) */
  target?: string
  /** Cloned or user-authored OpenGraph metadata (type=clone | custom) */
  ogData?: OgData
  /** Raw user-authored preview fields (type=custom), kept for editing */
  custom?: CustomPreview
  /** What a human visitor gets (type=custom): forward, or see custom HTML */
  humanAction?: 'redirect' | 'html'
  /** Custom HTML page body shown to humans (type=custom, humanAction=html) */
  bodyHtml?: string
  /** Free-form note: where did you plant this trap? */
  note?: string
  createdAt: number
  hitCount: number
}

export interface GeoInfo {
  country?: string
  countryCode?: string
  region?: string
  city?: string
  isp?: string
  org?: string
  asn?: string
  lat?: number
  lon?: number
}

export interface UAInfo {
  browser?: string
  browserVersion?: string
  os?: string
  osVersion?: string
  device?: string
  deviceType?: string
  engine?: string
}

export interface Hit {
  id: string
  trapId: string
  ts: number
  ip: string
  /** Full X-Forwarded-For chain + remote addr */
  ipChain: string[]
  method: string
  host: string
  path: string
  query: Record<string, string>
  referer?: string
  userAgent?: string
  acceptLanguage?: string
  ua: UAInfo
  geo?: GeoInfo
  /** Heuristic: looks like an automated client / bot */
  isBot: boolean
  botReason?: string
  headers: Record<string, string>
}
