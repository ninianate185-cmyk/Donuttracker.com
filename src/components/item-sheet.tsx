import { useState } from 'react'
import { motion } from 'motion/react'
import { Copy, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ALTERNATES, CRAFTS, byId, snapshotTime } from '@/data/catalog.ts'
import { fmt, num } from '@/lib/format.ts'
import { KEYS, useStored } from '@/lib/store.ts'
import type { Item, Plan, SalesSample } from '@/lib/types.ts'
import { UpdatedAt } from './update-time'
import { Change, GradeBadge, ItemIcon, Price, useWatch } from './bits'

export function ItemSheet({ id, onOpenChange, onItem }: { id: string | null; onOpenChange: (open: boolean) => void; onItem: (id: string) => void }) {
  const item = id ? byId.get(id) : undefined
  return (
    <Sheet open={!!item} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">{item && <Detail key={item.id} item={item} onItem={onItem} />}</SheetContent>
    </Sheet>
  )
}

function Detail({ item, onItem }: { item: Item; onItem: (id: string) => void }) {
  const recipe = CRAFTS.find((d) => d.id === item.id)?.recipe ?? null
  const alt = ALTERNATES[item.id]
  const [history] = useStored<Record<string, SalesSample>>(KEYS.history, {})
  const sample = history[item.id]
  const [, setPlans] = useStored<Plan[]>(KEYS.plans, [])
  const watch = useWatch()
  const [buy, setBuy] = useState(recipe ? recipe.cost.toFixed(2) : '')
  const [sell, setSell] = useState(item.price != null ? String(item.price) : '')
  const [qty, setQty] = useState(item.stack === 1 ? 1 : 64)
  const b = +buy
  const s = +sell
  const ready = b > 0 && s > 0

  return (
    <>
      <SheetHeader className="gap-4 border-b border-border p-5">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            whileHover={{ rotate: -6, scale: 1.06 }}
            className="grid size-24 shrink-0 place-items-center rounded-xl border border-border bg-surface"
          >
            <ItemIcon item={item} size={72} />
          </motion.div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <SheetTitle className="font-heading text-2xl leading-tight">{item.name}</SheetTitle>
            <SheetDescription className="num text-xs">
              minecraft:{item.id} · {item.category}
            </SheetDescription>
            <div className="flex flex-wrap gap-1.5">
              <GradeBadge grade={item.sourceGrade} />
              <span className="num rounded-full px-2 text-[11px] leading-5 text-muted-foreground ring-1 ring-border">Stack {item.stack ?? '?'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <Price item={item} className="text-4xl font-medium tracking-tight" />
          <Change value={item.change} className="text-sm" />
          {item.change != null && <span className="text-xs text-muted-foreground">7 days</span>}
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-5 p-5">
        {item.sourceTime && <UpdatedAt value={item.sourceTime} label="Quote updated" />}
        <div className="grid grid-cols-2 gap-2.5">
          <Stat label="October average" value={sample ? fmt(sample.average) + '*' : 'Unavailable'} hint={sample ? `${num(sample.transactions)} imported sales` : 'Import a sales CSV'} />
          <Stat label="Donut.Auction value" value={alt ? fmt(alt.price) : '—'} hint={alt ? `Checked ${alt.observedOn}; source age unknown` : 'Not observed'} />
        </div>

        {recipe && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">
              Recipe · makes {recipe.yield}
            </h3>
            <div className="divide-y divide-border rounded-lg border border-border">
              {recipe.lines.map((l) => (
                <button key={l.id} type="button" onClick={() => onItem(l.id)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent">
                  <ItemIcon item={byId.get(l.id)} size={22} />
                  <span className="flex-1">
                    {num(l.count)} × {l.name}
                  </span>
                  <span className="num">{fmt(l.price * l.count)}</span>
                </button>
              ))}
              <div className="flex justify-between px-3 py-2 text-sm font-medium">
                <span>Cost per item</span>
                <span className="num">{fmt(recipe.cost)}</span>
              </div>
            </div>
          </section>
        )}

        <div className="grid h-24 place-items-center rounded-lg border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
          No verified price history yet. A chart appears once dated sales are imported.
        </div>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold">Plan a flip</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <Field id="sheet-buy" label="Buy / item" value={buy} onChange={setBuy} placeholder="Your buy price" />
            <Field id="sheet-sell" label="Sell / item" value={sell} onChange={setSell} placeholder="Your target" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sheet-qty" className="flex justify-between text-xs text-muted-foreground">
              Quantity <span className="num text-foreground">{qty}</span>
            </Label>
            <Slider id="sheet-qty" min={1} max={512} value={[qty]} onValueChange={(v) => setQty(v[0])} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="Capital" value={b > 0 ? fmt(b * qty) : '—'} />
            <Stat label="Spread" value={ready ? (s - b > 0 ? '+' : '') + fmt((s - b) * qty) : '—'} tone={ready ? (s >= b ? 'up' : 'down') : undefined} />
          </div>
          <Button
            disabled={!ready}
            onClick={() => {
              setPlans((p) => [{ id: item.id, buy: b, sell: s, qty, profit: (s - b) * qty, method: recipe ? 'Crafting' : 'Manual', created: new Date().toISOString() }, ...p])
              toast('Trade plan saved')
            }}
          >
            Save plan
          </Button>
        </section>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {item.source ? (
            <>
              Source:{' '}
              <a className="underline underline-offset-2 hover:text-foreground" href={item.source} target="_blank" rel="noopener noreferrer">
                DonutSMP Terminal
              </a>{' '}
              · snapshot {snapshotTime} · rounded public label{item.priceType ? ` · ${item.priceType.toLowerCase()} quote` : ''}.
            </>
          ) : (
            'No verified quote is available for this catalog entry.'
          )}
          {item.variantNote && <> {item.variantNote}.</>}
        </p>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => watch.toggle(item)}>
            <Star className="size-4" fill={watch.has(item.id) ? 'currentColor' : 'none'} />
            {watch.has(item.id) ? 'Watching' : 'Add to watchlist'}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              navigator.clipboard
                ?.writeText(item.id)
                .then(() => toast('Minecraft ID copied'))
                .catch(() => toast('Select the ID above to copy it.'))
            }
          >
            <Copy className="size-4" /> Copy ID
          </Button>
        </div>
      </div>
    </>
  )
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'up' | 'down' }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`num text-lg font-medium ${tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : ''}`}>{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

export function Field({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input id={id} className="num" type="number" min="0" step="0.01" inputMode="decimal" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
