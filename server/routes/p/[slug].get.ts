import { trackBySlug, antiCacheHeaders, PIXEL_GIF } from '../../utils/track'

/**
 * Tracking pixel: /p/<slug>  (embed in emails / docs as <img src="...">)
 * Always returns a 1x1 transparent GIF, whether or not the slug is known,
 * so the embed never breaks and never reveals trap existence.
 */
export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'slug')!
  // Allow slugs that carry a fake extension, e.g. logo.png
  const slug = raw.replace(/\.(png|gif|jpg|jpeg|webp)$/i, '')
  antiCacheHeaders(event)
  await trackBySlug(event, slug)
  setResponseHeader(event, 'Content-Type', 'image/gif')
  return PIXEL_GIF
})
