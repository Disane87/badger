import type { H3Event } from 'h3'
import { getTrapBySlug, recordHit } from './db'
import { buildHit } from './meta'
import type { Hit, Trap } from './types'

export interface TrackResult {
  trap: Trap
  /** Recorded hit (undefined if logging failed) */
  hit?: Omit<Hit, 'id' | 'trapId'>
}

/**
 * Looks up a trap by slug, records the incoming request as a hit, and returns
 * the trap + hit. Returns null if no such trap exists (caller should serve a
 * decoy so the probe never learns whether the slug was "real").
 */
export async function trackBySlug(event: H3Event, slug: string): Promise<TrackResult | null> {
  const trap = await getTrapBySlug(slug)
  if (!trap) return null
  let hit: Omit<Hit, 'id' | 'trapId'> | undefined
  try {
    hit = await buildHit(event)
    await recordHit(trap.id, hit)
  } catch (err) {
    // Never let logging failures break the decoy response.
    console.error('[badger] failed to record hit', err)
  }
  return { trap, hit }
}

// 1x1 transparent GIF
export const PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
  'base64'
)

export function antiCacheHeaders(event: H3Event) {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  setResponseHeader(event, 'Pragma', 'no-cache')
  setResponseHeader(event, 'Expires', '0')
}
