import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowUpRight, Calculator, Gavel, Hammer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ContinuousTabs } from '@/components/continuous-tabs'
import { AnimatedNumber, Change, GradeBadge, ItemIcon, PageHead, Price, SectionTitle } from '@/components/bits'
import { SpawnerStage } from '@/components/spawner-stage'
import { useApp } from '@/app-context.tsx'
import { CRAFTS, FEATURED, ITEMS, META, SPAWNERS, byId, snapshotTime } from '@/data/catalog.ts'
import { fmt, pct, signed } from '@/lib/format.ts'
import { passesGrade } from '@/lib/market.ts'

const reliable = CRAFTS.filter((d) => passesGrade(d.recipe.grade, 'B'))
const priced = ITEMS.filter((d) => d.price != null)
const movers = priced.filter((d) => d.price! >= 1000 && d.change != null && passesGrade(d.sourceGrade, 'B'))

export default function Overview() {
  const { openItem, openSources } = useApp()
  const [dir, setDir] = useState<'up' | 'down'>('up')
  const topFlips = reliable.slice().sort((a, b) => b.recipe.profit - a.recipe.profit).slice(0, 6)
  const list = movers.slice().sort((a, b) => (dir === 'up' ? b.change! - a.change! : a.change! - b.change!)).slice(0, 7)

  return (
    <div className="flex flex-col gap-10">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <span className="text-xs font-medium tracking-[0.18em] text-primary uppercase">Donut SMP market</span>
          <PageHead
            title="Market overview"
            description={<>Rounded public quotes from DonutSMP Terminal, snapshot {snapshotTime}. Not a live feed.</>}
          />
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/market">
                Browse catalog <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" onClick={openSources}>
              Sources &amp; coverage
            </Button>
          </div>
        </div>
        <Card className="relative h-80 overflow-hidden p-0">
          <SpawnerStage type={SPAWNERS[0]} compact />
          <Link to="/spawners" className="absolute right-3 bottom-3 rounded-lg border border-border bg-background/80 px-3 py-2 text-xs backdrop-blur hover:border-primary">
            <span className="block text-muted-foreground">Skeleton spawner</span>
            <span className="font-medium">Open calculator →</span>
          </Link>
        </Card>
      </div>

      <Card className="grid grid-cols-2 gap-0 divide-border p-0 md:grid-cols-4 md:divide-x [&>*]:border-border max-md:[&>*:nth-child(-n+2)]:border-b max-md:[&>*:nth-child(odd)]:border-r">
        <Kpi label="Catalog entries" value={ITEMS.length} hint={`Java 26.1 + server items`} />
        <Kpi label="Priced items" value={META.priceCount} hint={`${priced.filter((d) => passesGrade(d.sourceGrade, 'B')).length.toLocaleString('en-US')} graded S–B`} />
        <Kpi label="Reliable crafting flips" value={reliable.length} hint={`of ${CRAFTS.length} priced recipes`} />
        <Kpi label="Best reliable spread" value={topFlips[0]?.recipe.profit ?? 0} format={(n) => '+' + fmt(n)} hint={topFlips[0]?.name ?? ''} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="gap-0 p-0">
          <div className="px-5 pt-4 pb-2">
            <SectionTitle
              action={
                <Link to="/flips" className="text-sm text-muted-foreground hover:text-foreground">
                  All flips →
                </Link>
              }
            >
              Best crafting spreads
            </SectionTitle>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Item</TableHead>
                <TableHead className="text-right">Craft cost</TableHead>
                <TableHead className="text-right">Quote</TableHead>
                <TableHead className="text-right">Spread</TableHead>
                <TableHead className="text-right max-xl:hidden">ROI</TableHead>
                <TableHead className="pr-5 text-right">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topFlips.map((d) => (
                <TableRow key={d.id} className="cursor-pointer" onClick={() => openItem(d.id)}>
                  <TableCell className="pl-5">
                    <button type="button" className="flex items-center gap-2.5 text-left font-medium" onClick={() => openItem(d.id)}>
                      <ItemIcon item={d} size={26} /> {d.name}
                    </button>
                  </TableCell>
                  <TableCell className="num text-right">{fmt(d.recipe.cost)}</TableCell>
                  <TableCell className="text-right">
                    <Price item={d} />
                  </TableCell>
                  <TableCell className="num text-right font-medium text-up">{signed(d.recipe.profit)}</TableCell>
                  <TableCell className="num text-right text-muted-foreground max-xl:hidden">{pct(d.recipe.roi)}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <GradeBadge grade={d.recipe.grade} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="px-5 py-3 text-xs text-muted-foreground">Spread from rounded quotes, grade S–B only. Not a confirmed buyer or realized profit.</p>
        </Card>

        <Card className="gap-0 p-0">
          <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
            <h2 className="text-[15px] font-semibold">7-day movers</h2>
            <ContinuousTabs label="Mover direction" size="sm" value={dir} onChange={setDir} tabs={[{ id: 'up', label: 'Gainers' }, { id: 'down', label: 'Losers' }]} />
          </div>
          <motion.ul layout className="flex flex-col">
            {list.map((d, i) => (
              <motion.li key={d.id} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <button type="button" onClick={() => openItem(d.id)} className="flex w-full items-center gap-3 border-t border-border px-5 py-2.5 text-left text-sm hover:bg-accent">
                  <ItemIcon item={d} size={22} />
                  <span className="flex-1 truncate">{d.name}</span>
                  <Price item={d} className="text-muted-foreground" />
                  <Change value={d.change} className="w-20 text-right font-medium" />
                </button>
              </motion.li>
            ))}
          </motion.ul>
          <p className="px-5 py-3 text-xs text-muted-foreground">Grade S–B, quote ≥ 1K. Change reported by the source.</p>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle
          action={
            <Link to="/investments" className="text-sm text-muted-foreground hover:text-foreground">
              Compare →
            </Link>
          }
        >
          Featured investments
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {FEATURED.map((id) => byId.get(id)!).map((d) => (
            <motion.button
              key={d.id}
              type="button"
              whileHover={{ y: -3 }}
              onClick={() => openItem(d.id)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
            >
              <ItemIcon item={d} size={48} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">{d.name}</span>
                <span className="text-sm">
                  <Price item={d} /> <Change value={d.change} className="text-xs" />
                </span>
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3" aria-label="Tools">
        <Tool to="/spawners" icon={Calculator} title="Spawner calculator" text="Income and payback from your measured drop rates." />
        <Tool to="/flips?tab=order" icon={Hammer} title="Order flip planner" text="Buy-order price against a selling target." />
        <Tool to="/flips?tab=auction" icon={Gavel} title="Auction flip planner" text="Listing price, resale target and your selling fee." />
      </section>
    </div>
  )
}

function Kpi({ label, value, hint, format }: { label: string; value: number; hint: string; format?: (n: number) => string }) {
  return (
    <div className="flex flex-col gap-1.5 p-5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <AnimatedNumber value={value} format={format} className="text-2xl font-medium tracking-tight sm:text-3xl" />
      <span className="truncate text-xs text-muted-foreground">{hint}</span>
    </div>
  )
}

function Tool({ to, icon: Icon, title, text }: { to: string; icon: typeof Calculator; title: string; text: string }) {
  return (
    <Link to={to} className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary transition-transform group-hover:-rotate-6">
        <Icon className="size-5" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-muted-foreground">{text}</span>
      </span>
    </Link>
  )
}
