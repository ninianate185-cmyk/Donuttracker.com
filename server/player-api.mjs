/** Optional Cloudflare Worker for live stats. Deploy separately from the static site.
 * DONUTSMP_API_KEY is a server secret. VITE_PLAYER_API_URL points the UI here.
 */
const allowed = ['https://donut-tracker-nathan.ninianate185.chatgpt.site', 'https://ninianate185-cmyk.github.io']
const keys = ['money', 'shards', 'kills', 'deaths', 'playtime', 'broken_blocks', 'placed_blocks', 'mobs_killed', 'money_made_from_sell', 'money_spent_on_shop']
export async function handlePlayerRequest(request, env, upstream = fetch) {
  const origin = request.headers.get('Origin')
  const origins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : allowed
  const cors = origin && origins.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}
  const reply = (body, status) => Response.json(body, { status, headers: { ...cors, 'Cache-Control': 'no-store' } })
  if (origin && !origins.includes(origin)) return reply({ error: 'origin_not_allowed' }, 403)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } })
  if (request.method !== 'GET') return reply({ error: 'method_not_allowed' }, 405)
  const username = new URL(request.url).searchParams.get('username') ?? ''
  if (!/^\.?[a-zA-Z0-9_]{3,16}$/.test(username)) return reply({ error: 'invalid_username' }, 400)
  if (!env.DONUTSMP_API_KEY?.trim()) return reply({ error: 'not_connected' }, 503)
  try {
    const response = await upstream(`https://api.donutsmp.net/v1/stats/${encodeURIComponent(username)}`, {
      headers: { Authorization: `Bearer ${env.DONUTSMP_API_KEY.trim()}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(9000),
    })
    if (response.status === 429) return reply({ error: 'rate_limited' }, 429)
    if (response.status === 404) return reply({ error: 'not_found' }, 404)
    if (!response.ok) return reply({ error: 'upstream_unavailable' }, 502)
    const data = await response.json()
    if (data.status === 404) return reply({ error: 'not_found' }, 404)
    if (data.status && data.status !== 200) return reply({ error: 'upstream_unavailable' }, 502)
    if (!data.result || typeof data.result !== 'object' || Array.isArray(data.result)) return reply({ error: 'invalid_response' }, 502)
    const stats = Object.fromEntries(keys.map(key => [key, data.result[key] ?? null]))
    return reply({ username, stats, fetchedAt: new Date().toISOString() }, 200)
  } catch {
    return reply({ error: 'upstream_unavailable' }, 502)
  }
}
export default { fetch: (request, env) => handlePlayerRequest(request, env) }
