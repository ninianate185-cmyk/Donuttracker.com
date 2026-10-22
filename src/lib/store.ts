import { useSyncExternalStore } from 'react'

/* Browser-local state. Keys match the previous site, so saved watchlists and plans carry over. */
type Listener = () => void
const listeners = new Map<string, Set<Listener>>()
const cache = new Map<string, unknown>()

function read<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T
  let value = fallback
  try {
    value = JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    /* storage blocked or corrupt: fall back for this visit */
  }
  cache.set(key, value)
  return value
}

export function write<T>(key: string, value: T) {
  cache.set(key, value)
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: keep the in-memory value */
  }
  listeners.get(key)?.forEach((l) => l())
}

export function useStored<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    (l) => {
      if (!listeners.has(key)) listeners.set(key, new Set())
      listeners.get(key)!.add(l)
      return () => listeners.get(key)!.delete(l)
    },
    () => read(key, fallback),
  )
  const set = (next: T | ((prev: T) => T)) => write(key, typeof next === 'function' ? (next as (p: T) => T)(read(key, fallback)) : next)
  return [value, set]
}

export const KEYS = {
  watch: 'dt-watch-v2',
  plans: 'dt-plans-v2',
  history: 'dt-history-v2',
  spawnerInputs: 'dt-spawner-inputs-v1',
  spawnerSelected: 'dt-spawner-selected-v1',
} as const
