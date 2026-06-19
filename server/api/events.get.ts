import { onTrapEvent } from '../utils/events'

/**
 * Server-Sent Events stream. The dashboard opens a single EventSource here and
 * receives every trap/hit mutation the instant it happens — no polling.
 */
export default defineEventHandler((event) => {
  const stream = createEventStream(event)

  const unsubscribe = onTrapEvent((e) => {
    // h3's EventStream serialises whatever we hand it; send JSON the client
    // can JSON.parse back into { type, data }.
    stream.push(JSON.stringify(e))
  })

  // Heartbeat keeps proxies from closing an idle connection.
  const heartbeat = setInterval(() => {
    stream.push(JSON.stringify({ type: 'ping', data: null })).catch(() => {})
  }, 25000)

  stream.onClosed(async () => {
    clearInterval(heartbeat)
    unsubscribe()
    await stream.close()
  })

  return stream.send()
})
