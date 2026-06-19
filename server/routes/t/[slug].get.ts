import { trackBySlug, antiCacheHeaders } from '../../utils/track'
import { decoyPage } from '../../utils/decoy'
import { renderPreviewPage } from '../../utils/og'

/**
 * Generic tracking link: /t/<slug>
 * Behaviour depends on the trap type:
 *   - redirect: 302 to the configured target (looks like a normal short link)
 *   - clone:    serves a page with the target's cloned OpenGraph preview, then
 *               forwards real browsers to the target (link unfurlers just read
 *               the meta tags). A "man in the middle" preview proxy.
 *   - decoy:    serves a plausible-looking HTML page
 *   - pixel:    serves a 1x1 gif
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  antiCacheHeaders(event)
  const result = await trackBySlug(event, slug)

  // Unknown slug -> behave like a generic "not found"-ish decoy, never reveal.
  if (!result) {
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return decoyPage('document')
  }

  const { trap, hit } = result

  if (trap.type === 'redirect' && trap.target) {
    return sendRedirect(event, trap.target, 302)
  }

  if (trap.type === 'clone' && trap.target) {
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    // Link-preview crawlers (bots) get the clean cloned preview with no redirect;
    // real humans get forwarded to the genuine target after logging.
    const redirect = !(hit?.isBot ?? false)
    return renderPreviewPage({ og: trap.ogData, redirect, target: trap.target })
  }

  if (trap.type === 'custom') {
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    const isBot = hit?.isBot ?? false
    // Unfurlers always just read the meta tags (no redirect, no body action).
    // Humans either get forwarded or shown the operator's custom HTML.
    const wantsRedirect = trap.humanAction === 'redirect' && !!trap.target && !isBot
    return renderPreviewPage({
      og: trap.ogData,
      redirect: wantsRedirect,
      target: trap.target,
      bodyHtml: trap.humanAction === 'html' ? trap.bodyHtml : undefined
    })
  }

  if (trap.type === 'pixel') {
    const { PIXEL_GIF } = await import('../../utils/track')
    setResponseHeader(event, 'Content-Type', 'image/gif')
    return PIXEL_GIF
  }

  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return decoyPage('document', trap.name)
})
