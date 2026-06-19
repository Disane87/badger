import type { Hit, Trap } from '~~/server/utils/types'

export type LiveEvent =
  | { type: 'trap:created'; data: Trap }
  | { type: 'trap:updated'; data: Trap }
  | { type: 'trap:deleted'; data: { id: string } }
  | { type: 'hit'; data: Hit }
  | { type: 'ping'; data: null }

/**
 * Subscribes to the server's `/api/events` SSE stream and invokes `handler`
 * for every pushed event. EventSource auto-reconnects, so transient drops heal
 * themselves. Client-only — registers on mount, tears down on unmount.
 */
export function useLiveEvents(handler: (event: LiveEvent) => void) {
  let source: EventSource | null = null

  onMounted(() => {
    source = new EventSource('/api/events')
    source.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data) as LiveEvent
        if (parsed.type !== 'ping') handler(parsed)
      } catch {
        // ignore malformed frames
      }
    }
  })

  onBeforeUnmount(() => {
    source?.close()
    source = null
  })
}
