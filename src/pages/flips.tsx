import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ContinuousTabs } from '@/components/continuous-tabs'
import { Pagination } from '@/components/pagination'
import { GradeBadge, ItemIcon, PageHead, Price } from '@/components/bits'
import { Field } from '@/components/item-sheet'
import { useApp } from '@/app-context.tsx'
import { CRAFTS, ITEMS, byId } from '@/data/catalog.ts'
import { fmt, num, pct, signed } from '@/lib/format.ts'
import { matches, passesGrade, sortBy, type CraftItem } from '@/lib/market.ts'
import { KEYS, useStored } from '@/lib/store.ts'
import type { Grade, Item, Plan } from '@/lib/types.ts'
import { cn } from '@/lib/utils'

type Tab = 'crafting' | 'order' | 'auction'
type SortKey = 'profit' | 'roi' | 'cost'
const PAGE = 15

export default function Flips() {
  const { openItem } = useApp()
  const [params, setParams] = useSearchParams()
  const tab = (['crafting', 'order', 'auction'].includes(params.get('tab') ?? '') ? params.get('tab') : 'crafting') as Tab
  const [query, setQuery] = useState('')
  const [grade, setGrade] = useState<Grade>('B')
  const [budget, setBudget] = useState('')
  const [sort, setSort] = useState<SortKey>('profit')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState('netherite_ingot')

  const rows = useMemo(() => {
    const cap = +budget || Infinity
    const data = CRAFTS.filter((d) => passesGrade(d.recipe.grade, grade) && d.recipe.cost <= cap && matches(d, query))
    return sortBy(data, (d: CraftItem) => (sort === 'cost' ? d.recipe.cost : d.recipe[sort]), sort === 'cost' ? 1 : -1)
  }, [query, grade, budget, sort])
  const hidden = CRAFTS.length - CRAFTS.filter((d) => passesGrade(d.recipe.grade, grade)).length
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const current = Math.min(page, pages)
  const reset = (fn: () => void) => {
    fn()
    setPage(1)
  }
  const selectRecipe = (id: string) => {
    setSelected(id)
    if (tab !== 'crafting') setParams({ tab: 'crafting' }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHead title="Flips" description="Recipe spreads from sourced quotes. Pick a row to plan it, or plan an order or auction flip with your own prices." />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <Card className="min-w-0 flex-1 gap-0 p-0">
          <div className="flex flex-wrap items-end gap-2 border-b border-border p-3">
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search recipes" className="pl-9" placeholder="Item or Minecraft ID…" value={query} onChange={(e) => reset(() => setQuery(e.target.value))} />
            </div>
            <Select value={grade} onValueChange={(v) => reset(() => setGrade(v as Grade))}>
              <SelectTrigger className="w-36" aria-label="Quote grade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Grade S–A</SelectItem>
                <SelectItem value="B">Grade S–B</SelectItem>
                <SelectItem value="C">Grade S–C</SelectItem>
                <SelectItem value="D">All grades</SelectItem>
              </SelectContent>
            </Select>
            <Input aria-label="Maximum craft cost per item" className="num w-36" type="number" min="0" placeholder="Max craft cost" value={budget} onChange={(e) => reset(() => setBudget(e.target.value))} />
            <Select value={sort} onValueChange={(v) => reset(() => setSort(v as SortKey))}>
              <SelectTrigger className="w-32" aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Spread</SelectItem>
                <SelectItem value="roi">ROI</SelectItem>
                <SelectItem value="cost">Craft cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Item</TableHead>
                <TableHead className="text-right">Craft cost</TableHead>
                <TableHead className="text-right max-sm:hidden">Quote</TableHead>
                <TableHead className="text-right">Spread</TableHead>
                <TableHead className="text-right max-md:hidden">ROI</TableHead>
                <TableHead className="pr-4 text-right">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice((current - 1) * PAGE, current * PAGE).map((d) => (
                <motion.tr
                  key={d.id}
                  layout="position"
                  aria-selected={selected === d.id}
                  onClick={() => selectRecipe(d.id)}
                  className={cn('cursor-pointer border-b border-border transition-colors hover:bg-accent/60', selected === d.id && 'bg-secondary')}
                >
                  <TableCell className="pl-4">
                    <button type="button" className="flex items-center gap-2.5 text-left font-medium" aria-pressed={selected === d.id} onClick={(event) => { event.stopPropagation(); selectRecipe(d.id) }}>
                      <ItemIcon item={d} size={26} /> {d.name}
                    </button>
                  </TableCell>
                  <TableCell className="num text-right">{fmt(d.recipe.cost)}</TableCell>
                  <TableCell className="text-right max-sm:hidden">
                    <Price item={d} />
                  </TableCell>
                  <TableCell className={cn('num text-right font-medium', d.recipe.profit >= 0 ? 'text-up' : 'text-down')}>{signed(d.recipe.profit)}</TableCell>
                  <TableCell className="num text-right text-muted-foreground max-md:hidden">{pct(d.recipe.roi)}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <GradeBadge grade={d.recipe.grade} />
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-3 p-3">
            <span className="text-sm text-muted-foreground">
              {num(rows.length)} recipes{hidden > 0 && ` · ${num(hidden)} hidden by grade`}
            </span>
            <Pagination totalPages={pages} value={current} onChange={setPage} />
          </div>
        </Card>

        <Card className="gap-4 p-4 xl:sticky xl:top-28 xl:w-96 xl:shrink-0" aria-label="Flip planner">
          <ContinuousTabs
            label="Planner type"
            value={tab}
            onChange={(t) => setParams({ tab: t }, { replace: true })}
            tabs={[
              { id: 'crafting', label: 'Crafting' },
              { id: 'order', label: 'Order' },
              { id: 'auction', label: 'Auction' },
            ]}
            className="self-start"
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
              {tab === 'crafting' ? (
                <CraftPlanner key={selected} item={CRAFTS.find((d) => d.id === selected) ?? rows[0]} onItem={openItem} />
              ) : (
                <ManualPlanner key={tab} kind={tab} initial={byId.get(selected)} />
              )}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  )
}

function useSavePlan() {
  const [, setPlans] = useStored<Plan[]>(KEYS.plans, [])
  return (plan: Omit<Plan, 'created'>) => {
    setPlans((p) => [{ ...plan, created: new Date().toISOString() }, ...p])
    toast('Trade plan saved', { description: 'Find it under Watchlist & plans.' })
  }
}

function Results({ capital, spread }: { capital: number | null; spread: number | null }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
        <span className="text-xs text-muted-foreground">Capital</span>
        <span className="num text-xl font-medium">{capital == null ? '—' : fmt(capital)}</span>
      </div>
      <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
        <span className="text-xs text-muted-foreground">Spread</span>
        <span className={cn('num text-xl font-medium', spread != null && (spread >= 0 ? 'text-up' : 'text-down'))}>{spread == null ? '—' : signed(spread)}</span>
      </div>
    </div>
  )
}

function CraftPlanner({ item, onItem }: { item: CraftItem | undefined; onItem: (id: string) => void }) {
  const save = useSavePlan()
  const [sell, setSell] = useState(item?.price != null ? String(item.price) : '')
  const [qty, setQty] = useState('16')
  if (!item) return <p className="text-sm text-muted-foreground">No recipe matches the current filters.</p>
  const s = +sell
  const q = Number(qty)
  const validQty = Number.isSafeInteger(q) && q > 0
  const ok = Number.isFinite(s) && s > 0 && validQty
  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={() => onItem(item.id)} className="flex items-center gap-3 text-left">
        <ItemIcon item={item} size={44} />
        <span className="flex flex-col">
          <span className="font-semibold">{item.name}</span>
          <span className="text-xs text-muted-foreground">
            Recipe makes {item.recipe.yield} · Grade {item.recipe.grade ?? '—'} · details ↗
          </span>
        </span>
      </button>
      <div className="divide-y divide-border rounded-lg border border-border text-sm">
        {item.recipe.lines.map((l) => (
          <div key={l.id} className="flex items-center gap-2.5 px-3 py-2">
            <ItemIcon item={byId.get(l.id)} size={20} />
            <span className="flex-1">
              {num(l.count)} × {l.name}
            </span>
            <span className="num">{fmt(l.count * l.price)}</span>
          </div>
        ))}
        <div className="flex justify-between px-3 py-2 font-medium">
          <span>Cost per item</span>
          <span className="num">{fmt(item.recipe.cost)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field id="craft-sell" label="Sell / item" value={sell} onChange={setSell} />
        <Field id="craft-qty" label="Quantity" value={qty} onChange={setQty} min={1} step="1" error={qty !== '' && !validQty ? 'Enter a whole quantity of at least 1.' : undefined} />
      </div>
      <Results capital={validQty ? item.recipe.cost * q : null} spread={ok ? (s - item.recipe.cost) * q : null} />
      <Button disabled={!ok} onClick={() => save({ id: item.id, buy: item.recipe.cost, sell: s, qty: q, profit: (s - item.recipe.cost) * q, method: 'Crafting' })}>
        Save plan
      </Button>
    </div>
  )
}

function ManualPlanner({ kind, initial }: { kind: 'order' | 'auction'; initial: Item | undefined }) {
  const save = useSavePlan()
  const auction = kind === 'auction'
  const [name, setName] = useState(initial ? `${initial.name} — ${initial.id}` : '')
  const findItem = (value: string) => byId.get(value.split(' — ').at(-1)?.trim() ?? '') ?? ITEMS.find((d) => d.name.toLowerCase() === value.trim().toLowerCase())
  const item = findItem(name)
  const [buy, setBuy] = useState('')
  const [sell, setSell] = useState(initial?.price != null ? String(initial.price) : '')
  const [fee, setFee] = useState('')
  const [qty, setQty] = useState('64')
  const b = +buy
  const s = +sell
  const f = Number(fee)
  const q = Number(qty)
  const validQty = Number.isSafeInteger(q) && q > 0
  const validFee = Number.isFinite(f) && f >= 0 && f <= 100
  const validPrices = Number.isFinite(b) && b > 0 && Number.isFinite(s) && s > 0
  const ok = !!item && validPrices && validQty && validFee
  const spread = ok ? (s * (1 - f / 100) - b) * q : null
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {auction
          ? 'A listing you saw on the auction house against your resale target. Add a selling fee if your listings pay one.'
          : 'The price you will offer with a buy order against your selling target. Orders can take time to fill.'}
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="plan-item" className="text-xs text-muted-foreground">
          Item
        </Label>
        <Input
          id="plan-item"
          list="plan-items"
          placeholder="Search an item…"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            const d = findItem(e.target.value)
            setSell(d?.price != null ? String(d.price) : '')
          }}
        />
        <datalist id="plan-items">
          {ITEMS.map((d) => (
            <option key={d.id} value={`${d.name} — ${d.id}`} />
          ))}
        </datalist>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field id="plan-buy" label={auction ? 'Listing price / item' : 'Order price / item'} value={buy} onChange={setBuy} />
        <Field id="plan-sell" label={auction ? 'Resell / item' : 'Sell / item'} value={sell} onChange={setSell} />
        {auction && <Field id="plan-fee" label="Selling fee %" value={fee} onChange={setFee} placeholder="Optional" error={!validFee ? 'Enter a fee from 0 to 100%.' : undefined} />}
        <Field id="plan-qty" label="Quantity" value={qty} onChange={setQty} min={1} step="1" error={qty !== '' && !validQty ? 'Enter a whole quantity of at least 1.' : undefined} />
      </div>
      <Results capital={Number.isFinite(b) && b > 0 && validQty ? b * q : null} spread={spread} />
      <Button disabled={!ok} onClick={() => item && save({ id: item.id, buy: b, sell: s, qty: q, fee: auction ? f : undefined, profit: spread!, method: auction ? 'Auction' : 'Order' })}>
        Save plan
      </Button>
    </div>
  )
}
