import type { Hit } from '~~/server/utils/types'

export function useFormat() {
  function relTime(ts: number): string {
    const diff = Date.now() - ts
    const s = Math.floor(diff / 1000)
    if (s < 60) return `${s}s ago`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    return `${d}d ago`
  }

  function absTime(ts: number): string {
    return new Date(ts).toLocaleString()
  }

  function geoLabel(hit: Hit): string {
    if (!hit.geo) return '—'
    return [hit.geo.city, hit.geo.country].filter(Boolean).join(', ') || '—'
  }

  /**
   * Iconify name for a hit's country flag from the locally-bundled
   * `circle-flags` collection. Falls back to a neutral globe when the
   * geo lookup yielded no country code.
   */
  function flagIcon(hit: Hit): string {
    const cc = hit.geo?.countryCode?.toLowerCase()
    return cc ? `circle-flags:${cc}` : 'lucide:globe'
  }

  function hasCoords(hit: Hit): boolean {
    return typeof hit.geo?.lat === 'number' && typeof hit.geo?.lon === 'number'
  }

  /**
   * OpenStreetMap embed URL framing a hit's coordinates, with a marker.
   * Returns '' when the hit has no usable coordinates.
   */
  function mapUrl(hit: Hit): string {
    if (!hasCoords(hit)) return ''
    const lat = hit.geo!.lat as number
    const lon = hit.geo!.lon as number
    const dx = 3.2
    const dy = 1.7
    const bbox = [lon - dx, lat - dy, lon + dx, lat + dy]
      .map((n) => n.toFixed(4))
      .join('%2C')
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(4)}%2C${lon.toFixed(4)}`
  }

  function uaLabel(hit: Hit): string {
    const u = hit.ua
    const browser = [u.browser, u.browserVersion?.split('.')[0]].filter(Boolean).join(' ')
    const os = [u.os, u.osVersion].filter(Boolean).join(' ')
    return [browser, os].filter(Boolean).join(' · ') || (hit.userAgent ? 'Unknown client' : 'No UA')
  }

  return { relTime, absTime, geoLabel, uaLabel, flagIcon, hasCoords, mapUrl }
}

export function trapUrls(slug: string, type: string, origin: string) {
  const base = (origin || '').replace(/\/$/, '')
  if (type === 'pixel') return `${base}/p/${slug}.png`
  return `${base}/t/${slug}`
}

/**
 * The public origin to build tracking links from:
 * configured NUXT_PUBLIC_BASE_URL wins (for deployments behind a domain),
 * otherwise the browser's current origin.
 */
export function usePublicOrigin() {
  const config = useRuntimeConfig()
  // useRequestURL() resolves on both server (from request headers) and client,
  // so SSR and hydration agree — no mismatch, and real URLs render server-side.
  const url = useRequestURL()
  return computed(() => {
    const configured = (config.public.baseUrl as string) || ''
    return (configured || url.origin).replace(/\/$/, '')
  })
}
