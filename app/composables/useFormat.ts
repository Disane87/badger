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

  function uaLabel(hit: Hit): string {
    const u = hit.ua
    const browser = [u.browser, u.browserVersion?.split('.')[0]].filter(Boolean).join(' ')
    const os = [u.os, u.osVersion].filter(Boolean).join(' ')
    return [browser, os].filter(Boolean).join(' · ') || (hit.userAgent ? 'Unknown client' : 'No UA')
  }

  return { relTime, absTime, geoLabel, uaLabel }
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
