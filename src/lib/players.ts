export const STAT_KEYS = ['money', 'shards', 'kills', 'deaths', 'playtime', 'broken_blocks', 'placed_blocks', 'mobs_killed', 'money_made_from_sell', 'money_spent_on_shop'] as const
export type StatKey = typeof STAT_KEYS[number]
export type PlayerStats = Record<StatKey, number | null>
export type PlayerResult = { username: string; stats: PlayerStats; fetchedAt: string }
export type PlayerErrorCode = 'not_connected' | 'not_found' | 'rate_limited' | 'unavailable' | 'invalid_response'
export class PlayerError extends Error {
  code: PlayerErrorCode
  constructor(code: PlayerErrorCode) { super(code); this.code = code }
}
export const validUsername = (name: string) => /^\.?[a-zA-Z0-9_]{3,16}$/.test(name)
export function parseStats(raw: unknown): PlayerStats {
  if (!raw || typeof raw !== 'object') throw new PlayerError('invalid_response')
  const source = raw as Record<string, unknown>
  const entries = STAT_KEYS.map((key) => {
    const v = source[key]
    // Missing/blank stats never become zero. Only unformatted API numbers are accepted.
    const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d+(\.\d+)?$/.test(v.trim()) ? Number(v) : NaN
    return [key, Number.isFinite(n) && n >= 0 ? n : null] as const
  })
  if (entries.every(([, value]) => value === null)) throw new PlayerError('invalid_response')
  return Object.fromEntries(entries) as PlayerStats
}
export async function fetchPlayer(username: string, signal: AbortSignal): Promise<PlayerResult> {
  const base = import.meta.env.VITE_PLAYER_API_URL?.trim()
  if (!base) throw new PlayerError('not_connected')
  const url = new URL(base)
  if (url.protocol !== 'https:' && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') throw new PlayerError('unavailable')
  url.searchParams.set('username', username)
  const res = await fetch(url, { signal, credentials: 'omit', cache: 'no-store' })
  if (res.status === 404) throw new PlayerError('not_found')
  if (res.status === 429) throw new PlayerError('rate_limited')
  if (res.status === 503) throw new PlayerError('not_connected')
  if (!res.ok) throw new PlayerError('unavailable')
  const data = await res.json()
  if (typeof data.fetchedAt !== 'string' || !Number.isFinite(Date.parse(data.fetchedAt))) throw new PlayerError('invalid_response')
  return { username, fetchedAt: data.fetchedAt, stats: parseStats(data.stats) }
}
export function playtime(ms: number | null): string {
  if (ms == null) return '—'
  const mins = Math.floor(ms / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  return days ? `${days}d ${hours % 24}h` : hours ? `${hours}h ${mins % 60}m` : `${mins}m`
}
export function killDeath(stats: PlayerStats): string {
  if (stats.kills == null || stats.deaths == null) return '—'
  return stats.deaths === 0 ? (stats.kills === 0 ? '—' : 'No deaths') : (stats.kills / stats.deaths).toFixed(2)
}
