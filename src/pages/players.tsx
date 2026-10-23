import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { ArrowUpRight, Check, Clock3, Coins, Copy, Gem, Loader2, RefreshCw, Search, Shield, Swords, UserRound, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHead } from '@/components/bits'
import { UpdatedAt } from '@/components/update-time'
import { fetchPlayer, killDeath, PlayerError, playtime, validUsername } from '@/lib/players.ts'
import type { PlayerErrorCode, PlayerResult, StatKey } from '@/lib/players.ts'
import { fmt, num } from '@/lib/format.ts'

const STATS: { key: StatKey; label: string; icon: typeof Coins; format?: (n: number | null) => string }[] = [
  { key: 'money', label: 'Balance', icon: Coins, format: fmt },
  { key: 'shards', label: 'Shards', icon: Gem, format: num },
  { key: 'kills', label: 'Kills', icon: Swords, format: num },
  { key: 'deaths', label: 'Deaths', icon: Shield, format: num },
  { key: 'playtime', label: 'Playtime', icon: Clock3, format: playtime },
  { key: 'mobs_killed', label: 'Mobs killed', icon: Swords, format: num },
  { key: 'broken_blocks', label: 'Blocks broken', icon: Coins, format: num },
  { key: 'placed_blocks', label: 'Blocks placed', icon: Coins, format: num },
  { key: 'money_made_from_sell', label: 'Earned from /sell', icon: Coins, format: fmt },
  { key: 'money_spent_on_shop', label: 'Spent in /shop', icon: Coins, format: fmt },
]
const ERRORS: Record<PlayerErrorCode, { title: string; description: string }> = {
  not_connected: { title: 'Live stats aren’t connected yet', description: 'Player stats will appear here once the site’s Donut SMP API connection is set up. No stats have been loaded for this player.' },
  not_found: { title: 'Player not found', description: 'Check the username and try again. The player may not have a Donut SMP profile.' },
  rate_limited: { title: 'Too many searches', description: 'The stats service is busy. Wait a minute before trying again.' },
  unavailable: { title: 'Stats are temporarily unavailable', description: 'The stats service could not be reached. Try again shortly.' },
  invalid_response: { title: 'Stats could not be verified', description: 'The service returned an incomplete response. Try again later.' },
}

export default function Players() {
  const [params, setParams] = useSearchParams()
  const name = params.get('name') ?? ''
  const [input, setInput] = useState(name)
  const [invalid, setInvalid] = useState('')
  const [result, setResult] = useState<PlayerResult | null>(null)
  const [error, setError] = useState<PlayerErrorCode | null>(null)
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [copied, setCopied] = useState(false)
  const sequence = useRef(0)
  const connected = !!import.meta.env.VITE_PLAYER_API_URL?.trim()

  useEffect(() => {
    setInput(name)
    setCopied(false)
    setInvalid('')
    setResult(null)
    setError(null)
    if (!name) { setLoading(false); return }
    if (!validUsername(name)) { setInvalid('Use 3–16 letters, numbers, or underscores. Bedrock names may start with a dot.'); setLoading(false); return }
    const request = ++sequence.current
    const ctrl = new AbortController()
    setLoading(true)
    const timer = window.setTimeout(() => ctrl.abort(), 12000)
    fetchPlayer(name, ctrl.signal).then((data) => {
      if (request === sequence.current && !ctrl.signal.aborted) setResult(data)
    }).catch((e: unknown) => {
      if (request === sequence.current) setError(e instanceof PlayerError ? e.code : 'unavailable')
    }).finally(() => { clearTimeout(timer); if (request === sequence.current) setLoading(false) })
    return () => { sequence.current++; clearTimeout(timer); ctrl.abort() }
  }, [name, refresh])

  return <div className="flex flex-col gap-7">
    <PageHead title="Player search" description="Look up a Donut SMP player’s balance, combat stats, playtime, and more." action={<span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${connected ? 'border-up/30 text-up' : 'border-ember/30 text-ember'}`}><span className="size-1.5 rounded-full bg-current" />{connected ? 'Stats connection configured' : 'Stats not connected'}</span>} />
    <Card className="gap-0 p-5 sm:p-6">
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); const next = input.trim(); if (!validUsername(next)) { setInvalid('Enter a valid Minecraft username: 3–16 letters, numbers, or underscores.'); return } setInvalid(''); if (next === name) setRefresh((n) => n + 1); else setParams({ name: next }) }}>
        <Label htmlFor="player-name">Minecraft username</Label>
        <div className="flex gap-2"><div className="relative flex-1"><Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" /><Input id="player-name" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={17} placeholder="Enter a player’s username…" value={input} onChange={(e) => { setInput(e.target.value); setInvalid('') }} aria-invalid={!!invalid} aria-describedby="player-help" className="h-10 pl-9" /></div><Button type="submit" disabled={loading} className="h-10">{loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}<span className="max-sm:hidden">Search player</span></Button></div>
        <p id="player-help" className={`text-xs ${invalid ? 'text-down' : 'text-muted-foreground'}`} role={invalid ? 'alert' : undefined}>{invalid || 'Use the exact in-game username. Player searches can be shared using this page’s link.'}</p>
      </form>
    </Card>
    <div aria-live="polite" aria-busy={loading}>
      {!name && <Card className="items-center gap-4 px-6 py-12 text-center"><span className="grid size-16 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary"><Users className="size-8" /></span><div><h2 className="font-heading text-2xl font-semibold">Every player has a story.</h2><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Enter a username to open their player profile. Stats come from the official Donut SMP API when connected.</p></div><div className="mt-2 flex flex-wrap justify-center gap-2">{[{ icon: Coins, label: 'Balance & shards' }, { icon: Swords, label: 'Combat stats' }, { icon: Clock3, label: 'Playtime & activity' }].map(({ icon: Icon, label }) => <span key={label} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-foreground"><Icon className="size-3.5" />{label}</span>)}</div></Card>}
      {name && !invalid && <section className="flex flex-col gap-4" aria-label="Player profile">
        <Card className="flex-row flex-wrap items-center justify-between gap-4 p-5"><div className="flex min-w-0 items-center gap-3"><span className="grid size-14 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-primary"><UserRound className="size-7" /></span><div><p className="text-xs text-muted-foreground">PLAYER SEARCH</p><h2 className="font-heading text-2xl font-semibold break-all">{name}</h2><p className="mt-1 text-xs text-muted-foreground">{result ? 'Stats returned by Donut SMP' : 'Profile not verified yet'}</p></div></div><div className="flex gap-2"><Button variant="outline" size="sm" disabled={loading || !connected} onClick={() => setRefresh((n) => n + 1)}><RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh stats</Button><Button variant="outline" size="sm" onClick={() => { navigator.clipboard?.writeText(location.href).then(() => setCopied(true)).catch(() => setCopied(false)) }}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? 'Copied' : 'Share'}</Button></div></Card>
        {loading && <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Checking player stats…</p>}
        {error && <Card className="gap-2 border-ember/25 bg-ember/5 p-5" role="status"><h3 className="font-semibold text-ember">{ERRORS[error].title}</h3><p className="max-w-2xl text-sm text-muted-foreground">{ERRORS[error].description}</p>{error === 'not_connected' && <p className="text-xs text-muted-foreground">You can check this player in-game with <code className="rounded bg-secondary px-1.5 py-0.5 text-foreground">/stats {name}</code>.</p>}</Card>}
        <div className="flex flex-wrap justify-between gap-2 px-1 text-xs text-muted-foreground">{result ? <UpdatedAt value={result.fetchedAt} label="Stats retrieved" /> : <span><Clock3 className="mr-1.5 inline size-3.5" />Last stats update: unavailable</span>}<span>Missing values are shown as —</span></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{STATS.map(({ key, label, icon: Icon, format }, i) => <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}><Card className="h-full gap-3 p-4"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-3.5" />{label}</span><strong className="num text-2xl font-medium" title={result?.stats[key] == null ? 'Not available' : String(result.stats[key])}>{result ? format!(result.stats[key]) : '—'}</strong></Card></motion.div>)}<Card className="gap-3 p-4"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Swords className="size-3.5" />Kill / death ratio</span><strong className="num text-2xl font-medium">{result ? killDeath(result.stats) : '—'}</strong></Card></div>
      </section>}
    </div>
    <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">Source: <a href="https://api.donutsmp.net" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground">Official Donut SMP API<ArrowUpRight className="size-3" /></a><span>· Stats refresh only when searched. Market snapshot times are separate.</span></p>
  </div>
}
