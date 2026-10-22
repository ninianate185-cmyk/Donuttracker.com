import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Star, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Change, GradeBadge, ItemIcon, PageHead, Price, useWatch } from '@/components/bits'
import { useApp } from '@/app-context.tsx'
import { byId } from '@/data/catalog.ts'
import { fmt, num, signed } from '@/lib/format.ts'
import { KEYS, useStored } from '@/lib/store.ts'
import type { Plan, SalesSample } from '@/lib/types.ts'
import { cn } from '@/lib/utils'

export default function Watchlist() {
  const { openItem, openSources } = useApp()
  const watch = useWatch()
  const [plans, setPlans] = useStored<Plan[]>(KEYS.plans, [])
  const [history] = useStored<Record<string, SalesSample>>(KEYS.history, {})
  const items = watch.ids.map((id) => byId.get(id)).filter((d) => !!d)

  return (
    <div className="flex flex-col gap-7">
      <PageHead
        title="Watchlist & plans"
        description="Saved in this browser. No account needed."
        action={
          <Button variant="outline" onClick={openSources}>
            <Upload className="size-4" /> Import sales CSV
          </Button>
        }
      />

      <Card className="gap-0 p-0">
        <h2 className="px-5 pt-4 pb-2 text-[15px] font-semibold">
          Watching <span className="num font-normal text-muted-foreground">{items.length}</span>
        </h2>
        {items.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Item</TableHead>
                <TableHead className="text-right">Quote</TableHead>
                <TableHead className="text-right">7d</TableHead>
                <TableHead className="text-right max-sm:hidden">Grade</TableHead>
                <TableHead className="text-right max-md:hidden">October avg</TableHead>
                <TableHead className="w-12 pr-5">
                  <span className="sr-only">Remove</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false}>
                {items.map((d) => (
                  <motion.tr key={d.id} layout exit={{ opacity: 0, x: -20 }} className="border-b border-border hover:bg-accent/60">
                    <TableCell className="pl-5">
                      <button type="button" onClick={() => openItem(d.id)} className="flex items-center gap-3 font-medium">
                        <ItemIcon item={d} size={30} /> {d.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <Price item={d} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Change value={d.change} />
                    </TableCell>
                    <TableCell className="text-right max-sm:hidden">
                      <GradeBadge grade={d.sourceGrade} />
                    </TableCell>
                    <TableCell className="num text-right text-muted-foreground max-md:hidden">{history[d.id] ? fmt(history[d.id].average) + '*' : 'Unavailable'}</TableCell>
                    <TableCell className="pr-5">
                      <Button variant="ghost" size="icon" aria-label={`Remove ${d.name} from watchlist`} onClick={() => watch.toggle(d)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <Star className="size-8 text-muted-foreground" />
            <p className="font-medium">No items saved yet</p>
            <p className="text-sm text-muted-foreground">Use the star next to any item to track it here.</p>
            <Button asChild>
              <Link to="/market">Browse catalog</Link>
            </Button>
          </div>
        )}
      </Card>

      <Card className="gap-0 p-0">
        <h2 className="px-5 pt-4 pb-2 text-[15px] font-semibold">
          Trade plans <span className="num font-normal text-muted-foreground">{plans.length}</span>
        </h2>
        {plans.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right max-sm:hidden">Buy</TableHead>
                <TableHead className="text-right max-sm:hidden">Sell</TableHead>
                <TableHead className="text-right max-md:hidden">Fee</TableHead>
                <TableHead className="text-right">Planned spread</TableHead>
                <TableHead className="w-12 pr-5">
                  <span className="sr-only">Remove</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false}>
                {plans.map((p) => {
                  const d = byId.get(p.id)
                  if (!d) return null
                  return (
                    <motion.tr key={p.created + p.id} layout exit={{ opacity: 0, x: -20 }} className="border-b border-border hover:bg-accent/60">
                      <TableCell className="pl-5">
                        <button type="button" onClick={() => openItem(d.id)} className="flex items-center gap-3 font-medium">
                          <ItemIcon item={d} size={26} /> {d.name}
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full px-2 py-0.5 text-xs ring-1 ring-border">{p.method}</span>
                      </TableCell>
                      <TableCell className="num text-right">{num(p.qty)}</TableCell>
                      <TableCell className="num text-right max-sm:hidden">{fmt(p.buy)}</TableCell>
                      <TableCell className="num text-right max-sm:hidden">{fmt(p.sell)}</TableCell>
                      <TableCell className="num text-right text-muted-foreground max-md:hidden">{p.fee ? p.fee + '%' : '—'}</TableCell>
                      <TableCell className={cn('num text-right font-medium', p.profit >= 0 ? 'text-up' : 'text-down')}>{signed(p.profit)}</TableCell>
                      <TableCell className="pr-5">
                        <Button variant="ghost" size="icon" aria-label={`Remove ${d.name} plan`} onClick={() => setPlans(plans.filter((x) => x !== p))}>
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No plans yet. Save one from{' '}
            <Link to="/flips" className="text-primary hover:underline">
              Flips
            </Link>{' '}
            or any item&apos;s detail sheet.
          </p>
        )}
        {plans.length > 0 && <p className="px-5 py-3 text-xs text-muted-foreground">Plans are unrealized. Nothing is traded.</p>}
      </Card>
    </div>
  )
}
