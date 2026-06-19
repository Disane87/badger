import type { Trap, Hit } from './types'
import { emitTrapEvent } from './events'

/**
 * Tiny persistence layer on top of Nitro's FS storage.
 * Keys:
 *   traps:<trapId>           -> Trap
 *   hits:<trapId>:<hitId>    -> Hit
 */

function store() {
  return useStorage('db')
}

const TRAP_PREFIX = 'traps'
const HIT_PREFIX = 'hits'

export function newId(len = 10): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let out = ''
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(len))
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

export async function createTrap(data: Omit<Trap, 'id' | 'createdAt' | 'hitCount'>): Promise<Trap> {
  const trap: Trap = {
    id: newId(8),
    createdAt: Date.now(),
    hitCount: 0,
    ...data
  }
  await store().setItem(`${TRAP_PREFIX}:${trap.id}`, trap)
  emitTrapEvent({ type: 'trap:created', data: trap })
  return trap
}

export async function getTrap(id: string): Promise<Trap | null> {
  return (await store().getItem<Trap>(`${TRAP_PREFIX}:${id}`)) ?? null
}

export async function updateTrap(trap: Trap): Promise<Trap> {
  await store().setItem(`${TRAP_PREFIX}:${trap.id}`, trap)
  emitTrapEvent({ type: 'trap:updated', data: trap })
  return trap
}

export async function getTrapBySlug(slug: string): Promise<Trap | null> {
  const traps = await listTraps()
  return traps.find((t) => t.slug === slug) ?? null
}

export async function listTraps(): Promise<Trap[]> {
  const keys = await store().getKeys(TRAP_PREFIX)
  const items = await Promise.all(keys.map((k) => store().getItem<Trap>(k)))
  return items
    .filter((t): t is Trap => !!t)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteTrap(id: string): Promise<void> {
  await store().removeItem(`${TRAP_PREFIX}:${id}`)
  const hitKeys = await store().getKeys(`${HIT_PREFIX}:${id}`)
  await Promise.all(hitKeys.map((k) => store().removeItem(k)))
  emitTrapEvent({ type: 'trap:deleted', data: { id } })
}

export async function recordHit(trapId: string, data: Omit<Hit, 'id' | 'trapId'>): Promise<Hit> {
  const hit: Hit = { id: newId(12), trapId, ...data }
  await store().setItem(`${HIT_PREFIX}:${trapId}:${hit.id}`, hit)

  const trap = await getTrap(trapId)
  if (trap) {
    trap.hitCount = (trap.hitCount || 0) + 1
    await store().setItem(`${TRAP_PREFIX}:${trapId}`, trap)
    // Push the hit (for live feed / detail rows) and the new hitCount (for the
    // dashboard's per-trap counter) — both reactively, no client-side polling.
    emitTrapEvent({ type: 'trap:updated', data: trap })
  }
  emitTrapEvent({ type: 'hit', data: hit })
  return hit
}

export async function listHits(trapId: string): Promise<Hit[]> {
  const keys = await store().getKeys(`${HIT_PREFIX}:${trapId}`)
  const items = await Promise.all(keys.map((k) => store().getItem<Hit>(k)))
  return items
    .filter((h): h is Hit => !!h)
    .sort((a, b) => b.ts - a.ts)
}

export async function listAllHits(limit = 200): Promise<Hit[]> {
  const keys = await store().getKeys(HIT_PREFIX)
  const items = await Promise.all(keys.map((k) => store().getItem<Hit>(k)))
  return items
    .filter((h): h is Hit => !!h)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit)
}
