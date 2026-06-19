import type { Hit, Trap } from './types'

/**
 * Tiny in-process pub/sub used to push live updates to connected dashboards.
 *
 * Every data mutation (trap created / updated / deleted, hit recorded) calls
 * `emitTrapEvent`; the SSE endpoint (`/api/events`) subscribes and streams each
 * event to the browser, so the frontend never has to poll.
 *
 * State is module-level, so this works for the single-instance honeypot. If the
 * app is ever scaled to multiple workers, swap this for a shared bus (Redis,
 * Nitro's `useStorage` watch, etc.).
 */

export type TrapEvent =
  | { type: 'trap:created'; data: Trap }
  | { type: 'trap:updated'; data: Trap }
  | { type: 'trap:deleted'; data: { id: string } }
  | { type: 'hit'; data: Hit }

type Listener = (event: TrapEvent) => void

const listeners = new Set<Listener>()

/** Subscribe to live events. Returns an unsubscribe function. */
export function onTrapEvent(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Broadcast an event to every connected client. Never throws. */
export function emitTrapEvent(event: TrapEvent): void {
  for (const fn of listeners) {
    try {
      fn(event)
    } catch (err) {
      console.error('[badger] event listener failed', err)
    }
  }
}
