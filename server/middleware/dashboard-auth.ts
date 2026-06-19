/**
 * Gates every /api/* dashboard endpoint behind a shared token. The honeypot
 * streams victim PII (IPs, headers, cookies) so leaving these endpoints open
 * to the internet is a data-protection problem.
 *
 * Set HONEY_DASHBOARD_TOKEN in the environment. Clients send it as either:
 *   Authorization: Bearer <token>
 *   ?token=<token>
 *   Cookie: honey_token=<token>
 *
 * If the env var is unset, the server refuses every dashboard request — fail
 * closed. Set HONEY_AUTH_DISABLED=1 to explicitly allow open access (dev only).
 */

const SAFE_PATHS = ['/api/_nuxt_icon']

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

export default defineEventHandler((event) => {
  const path = event.path || ''
  if (!path.startsWith('/api/')) return
  if (SAFE_PATHS.some((p) => path.startsWith(p))) return

  if (process.env.HONEY_AUTH_DISABLED === '1') return

  const expected = process.env.HONEY_DASHBOARD_TOKEN
  if (!expected) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Dashboard auth not configured (set HONEY_DASHBOARD_TOKEN)'
    })
  }

  const auth = getRequestHeader(event, 'authorization') || ''
  const bearer = auth.replace(/^Bearer\s+/i, '')
  const provided =
    (bearer && bearer !== auth ? bearer : '') ||
    (getQuery(event).token as string | undefined) ||
    getCookie(event, 'honey_token') ||
    ''

  if (!provided || !timingSafeEqual(provided, expected)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
