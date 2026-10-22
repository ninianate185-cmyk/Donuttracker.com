import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Calculator, Hammer, LayoutGrid, Search, Star, TrendingUp } from 'lucide-react'
import { Kbd } from '@/components/ui/kbd'
import { ITEMS, snapshotTime } from '@/data/catalog.ts'
import { useApp } from '@/app-context.tsx'
import { passesGrade } from '@/lib/market.ts'
import { fmt, num } from '@/lib/format.ts'
import { cn } from '@/lib/utils'
import { Change, ItemIcon, useWatch } from './bits'
import { TipJarButton } from './tip-jar'

const NAV = [
  { to: '/', label: 'Overview' },
  { to: '/market', label: 'Market' },
  { to: '/flips', label: 'Flips' },
  { to: '/spawners', label: 'Spawners' },
  { to: '/investments', label: 'Investments' },
]

const TABS = [
  { to: '/', label: 'Overview', icon: LayoutGrid },
  { to: '/market', label: 'Market', icon: TrendingUp },
  { to: '/flips', label: 'Flips', icon: Hammer },
  { to: '/spawners', label: 'Spawners', icon: Calculator },
  { to: '/watchlist', label: 'Saved', icon: Star },
]

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="#d9a066" />
      <circle cx="16" cy="16" r="11" fill="var(--primary)" />
      <circle cx="16" cy="16" r="4.5" fill="var(--background)" />
      {[[9, 10, 'var(--ember)'], [22, 9, '#7fd8a8'], [24, 19, '#8fb8ff'], [10, 21, '#fff3d6'], [16, 24, 'var(--ember)']].map(([x, y, c], i) => (
        <rect key={i} x={x as number} y={y as number} width="2.4" height="2.4" rx=".4" fill={c as string} transform={`rotate(${i * 37} ${x} ${y})`} />
      ))}
    </svg>
  )
}

function Ticker() {
  const movers = ITEMS.filter((d) => d.price != null && d.price >= 1000 && d.change != null && passesGrade(d.sourceGrade, 'B'))
    .sort((a, b) => Math.abs(b.change!) - Math.abs(a.change!))
    .slice(0, 14)
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden || undefined}>
      {movers.map((d) => (
        <li key={d.id} className="flex items-center gap-2 whitespace-nowrap text-xs">
          <ItemIcon item={d} size={16} />
          <span className="text-muted-foreground">{d.name}</span>
          <span className="num">{fmt(d.price)}</span>
          <Change value={d.change} />
        </li>
      ))}
    </ul>
  )
  return (
    <div className="border-b border-border bg-surface/80">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-4 px-4 sm:px-8">
        <span className="hidden shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:flex">
          <span className="size-1.5 rounded-full bg-ember" /> Snapshot · {snapshotTime}
        </span>
        <div className="group relative flex flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]" aria-label="Biggest 7-day moves">
          <div className="motion-safe-only flex w-max animate-[marquee_60s_linear_infinite] group-hover:[animation-play-state:paused]">
            {row(false)}
            {row(true)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { openSearch, openSources, openTipJar } = useApp()
  const { ids } = useWatch()
  const location = useLocation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openSearch])

  // Block body: scrollTo returns a Promise in newer browsers, which React would treat as a cleanup.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-8">
          <NavLink to="/" className="flex items-center gap-2.5" aria-label="Donut Tracker home">
            <motion.span whileHover={{ rotate: 90 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="block">
              <Logo className="size-7" />
            </motion.span>
            <span className="font-heading text-lg font-bold tracking-tight">
              donut<span className="text-primary">tracker</span>
            </span>
          </NavLink>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} className="relative rounded-md px-3 py-1.5 text-sm">
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-md bg-secondary ring-1 ring-border" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                    <span className={cn('relative transition-colors', isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>{n.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex-1" />
          <button
            type="button"
            onClick={openSearch}
            className="hidden h-9 min-w-40 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm whitespace-nowrap text-muted-foreground transition hover:border-input hover:text-foreground sm:flex xl:min-w-60"
          >
            <Search className="size-4" /> Search<span className="max-xl:hidden"> {num(ITEMS.length)} items</span>
            <Kbd className="ml-auto">⌘K</Kbd>
          </button>
          <button type="button" onClick={openSearch} aria-label="Search items" className="grid size-10 place-items-center rounded-lg border border-border sm:hidden">
            <Search className="size-4" />
          </button>
          <TipJarButton onClick={openTipJar} />
          <NavLink
            to="/watchlist"
            aria-label={`Watchlist, ${ids.length} saved`}
            className={({ isActive }) => cn('relative grid size-9 place-items-center rounded-lg border border-border transition hover:bg-accent', isActive && 'bg-secondary')}
          >
            <Star className="size-4" fill={ids.length ? 'var(--ember)' : 'none'} stroke={ids.length ? 'var(--ember)' : 'currentColor'} />
            <AnimatePresence>
              {ids.length > 0 && (
                <motion.span
                  key={ids.length}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="num absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
                >
                  {ids.length}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        </div>
      </header>
      <Ticker />

      <main id="content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-28 outline-none sm:px-8 sm:pt-10 lg:pb-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-border pb-24 lg:pb-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-xs text-muted-foreground sm:px-8">
          <span>Independent community project. Not affiliated with Donut SMP.</span>
          <span className="flex-1" />
          <a href="https://donutsmpterminal.com/all_items" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            Quotes: DonutSMP Terminal ↗
          </a>
          <a href="https://donut.auction" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            Donut.Auction ↗
          </a>
          <button type="button" onClick={openSources} className="hover:text-foreground">
            Sources &amp; coverage
          </button>
        </div>
      </footer>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 px-2 pt-1 pb-[max(env(safe-area-inset-bottom),10px)] backdrop-blur-md lg:hidden">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className="relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]">
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="tab-dot" className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
                <t.icon className={cn('size-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className={isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
