import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Columns2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Kbd } from '@/components/ui/kbd'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Change, GradeBadge, ItemIcon, PageHead, Price, SectionTitle, WatchButton } from '@/components/bits'
import { useApp } from '@/app-context.tsx'
import { FEATURED, MATERIALS, byId } from '@/data/catalog.ts'
import type { Item } from '@/lib/types.ts'
import { cn } from '@/lib/utils'

export default function Investments() {
  const { openItem } = useApp()
  const [comparing, setComparing] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const featured = FEATURED.map((id) => byId.get(id)!)
  const materials = MATERIALS.map((id) => byId.get(id)!)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) && !document.querySelector('[role="dialog"]')) {
        setComparing((c) => !c)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggle = (d: Item) => {
    if (!picked.includes(d.id) && picked.length >= 3) return toast('Compare up to 3 items. Remove one to make room.')
    setPicked((p) => (p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id].slice(-3)))
  }
  const card = (d: Item, i: number, big: boolean) => (
    <motion.article
      key={d.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, type: 'spring', stiffness: 220, damping: 22 }}
      whileHover={{ y: -4 }}
      className={cn('group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors', picked.includes(d.id) ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/40')}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{d.category}</span>
        <span className="flex items-center gap-1">
          <GradeBadge grade={d.sourceGrade} />
          <WatchButton item={d} />
        </span>
      </div>
      <button type="button" onClick={() => (comparing ? toggle(d) : openItem(d.id))} className="flex flex-col gap-3 text-left" aria-label={comparing ? `${picked.includes(d.id) ? 'Remove' : 'Add'} ${d.name} ${picked.includes(d.id) ? 'from' : 'to'} comparison` : `View ${d.name}`}>
        <span className={cn('grid place-items-center rounded-lg bg-surface', big ? 'h-36' : 'h-24')}>
          <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }} className="block transition-transform group-hover:scale-110 group-hover:-rotate-6">
            <ItemIcon item={d} size={big ? 96 : 64} className="drop-shadow-[0_10px_10px_#0006]" />
          </motion.span>
        </span>
        <span className="font-heading text-[17px] font-semibold leading-snug tracking-[-0.015em]">{d.name}</span>
        <span className="flex items-baseline gap-2">
          <Price item={d} className="text-xl font-medium" />
          <Change value={d.change} className="text-sm" />
        </span>
      </button>
      {comparing && (
        <Button variant={picked.includes(d.id) ? 'default' : 'outline'} size="sm" onClick={() => toggle(d)}>
          {picked.includes(d.id) ? <Check className="size-4" /> : <Plus className="size-4" />}
          {picked.includes(d.id) ? 'Selected' : 'Add to compare'}
        </Button>
      )}
    </motion.article>
  )

  const items = picked.map((id) => byId.get(id)!)
  return (
    <div className="flex flex-col gap-8">
      <PageHead
        title="Investments"
        description="High-value items people hold. Quotes and 7-day change from the source; monthly averages need imported sales."
        action={
          <Button variant={comparing ? 'default' : 'outline'} aria-pressed={comparing} onClick={() => setComparing(!comparing)}>
            <Columns2 className="size-4" /> Compare <Kbd className="ml-1">C</Kbd>
          </Button>
        }
      />
      <section className="flex flex-col gap-3">
        <SectionTitle>Featured</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{featured.map((d, i) => card(d, i, true))}</div>
      </section>
      <section className="flex flex-col gap-3">
        <SectionTitle
          action={
            <Link to="/market" className="text-sm text-muted-foreground hover:text-foreground">
              Full catalog →
            </Link>
          }
        >
          Materials
        </SectionTitle>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{materials.map((d, i) => card(d, i + 4, false))}</div>
      </section>

      <AnimatePresence>
        {comparing && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} aria-label="Comparison">
            <Card className="gap-0 p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
                <h2 className="text-[15px] font-semibold">{items.length < 2 ? `Pick ${2 - items.length} more to compare` : `Comparing ${items.length} of 3`}</h2>
                <div className="flex items-center gap-2">
                  {items.map((d) => (
                    <button key={d.id} type="button" onClick={() => toggle(d)} aria-label={`Remove ${d.name} from comparison`} className="flex items-center gap-1 rounded-full bg-secondary py-1 pr-2 pl-1 text-xs hover:bg-accent">
                      <ItemIcon item={d} size={18} /> <X className="size-3" />
                    </button>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => setPicked([])} disabled={!items.length}>
                    Clear
                  </Button>
                </div>
              </div>
              {items.length >= 2 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5" />
                      {items.map((d) => (
                        <TableHead key={d.id} className="text-right last:pr-5">
                          <span className="inline-flex items-center gap-2">
                            <ItemIcon item={d} size={20} /> {d.name}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <Row label="Quote" items={items} cell={(d) => <Price item={d} className="font-medium" />} />
                    <Row label="7-day change" items={items} cell={(d) => <Change value={d.change} />} />
                    <Row label="Quote grade" items={items} cell={(d) => <GradeBadge grade={d.sourceGrade} />} />
                    <Row label="October average" items={items} cell={() => <span className="text-muted-foreground">Unavailable</span>} />
                    <Row label="Stack size" items={items} cell={(d) => <span className="num">{d.stack ?? '—'}</span>} />
                  </TableBody>
                </Table>
              )}
            </Card>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ label, items, cell }: { label: string; items: Item[]; cell: (d: Item) => React.ReactNode }) {
  return (
    <TableRow>
      <TableCell className="pl-5 text-muted-foreground">{label}</TableCell>
      {items.map((d) => (
        <TableCell key={d.id} className="text-right last:pr-5">
          {cell(d)}
        </TableCell>
      ))}
    </TableRow>
  )
}
