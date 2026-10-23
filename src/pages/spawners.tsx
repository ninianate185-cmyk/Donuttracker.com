import { motion } from 'motion/react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { AnimatedNumber, ItemIcon, PageHead } from '@/components/bits'
import { SpawnerStage } from '@/components/spawner-stage'
import { SPAWNERS, byId, snapshotTime } from '@/data/catalog.ts'
import { fmt } from '@/lib/format.ts'
import { spawnerEstimate } from '@/lib/spawner.ts'
import { KEYS, useStored } from '@/lib/store.ts'
import { cn } from '@/lib/utils'

interface Saved {
  count?: string | number
  hours?: string | number
  purchase?: string | number
  drops?: Record<string, { rate?: string | number; price?: string | number }>
}

export default function Spawners() {
  const [selected, setSelected] = useStored<string>(KEYS.spawnerSelected, 'skeleton')
  const [inputs, setInputs] = useStored<Record<string, Saved>>(KEYS.spawnerInputs, {})
  const type = SPAWNERS.find((t) => t.id === selected) ?? SPAWNERS[0]
  const saved = inputs[type.id] ?? {}
  const count = saved.count ?? 12
  const hours = saved.hours ?? 6
  const purchase = saved.purchase ?? ''
  const drops = type.drops.map((id) => ({ id, rate: saved.drops?.[id]?.rate ?? '', price: saved.drops?.[id]?.price ?? byId.get(id)?.price ?? '' }))
  const result = spawnerEstimate(count, hours, purchase, drops)
  const update = (patch: Saved) => setInputs({ ...inputs, [type.id]: { ...saved, ...patch } })
  const updateDrop = (id: string, patch: { rate?: string; price?: string }) =>
    update({ drops: { ...Object.fromEntries(drops.map((d) => [d.id, { rate: d.rate, price: d.price }])), [id]: { ...drops.find((d) => d.id === id), ...patch } } })

  return (
    <div className="flex flex-col gap-7">
      <PageHead title="Spawner calculator" description="Nine Donut SMP spawner types. Income from your own measured drop rates; inputs are saved per type in this browser." />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <Card className="gap-1 p-2 lg:w-60 lg:shrink-0" role="group" aria-label="Spawner type">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {SPAWNERS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={t.id === type.id}
                onClick={() => setSelected(t.id)}
                className={cn('relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors', t.id === type.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {t.id === type.id && <motion.span layoutId="spawner-pill" className="absolute inset-0 rounded-lg bg-secondary ring-1 ring-primary/40" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <ItemIcon item={byId.get(t.icon)} size={26} className="relative" />
                <span className="relative flex min-w-0 flex-col">
                  <span className="font-medium">{t.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{t.drops.map((d) => byId.get(d)?.name).join(', ')}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="min-w-0 flex-1 gap-0 p-0">
          <div className="grid gap-6 border-b border-border p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="h-72 overflow-hidden rounded-xl bg-surface md:h-auto md:min-h-72">
              <SpawnerStage key={type.id} type={type} />
            </div>
            <div className="flex flex-col gap-5">
              <h2 className="font-heading text-3xl font-semibold">{type.name}</h2>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sp-count" className="text-xs text-muted-foreground">
                  Spawner count
                </Label>
                <div className="flex items-center gap-3">
                  <Slider aria-label="Spawner count" min={1} max={4096} value={[Number(count) || 1]} onValueChange={(v) => update({ count: v[0] })} className="flex-1" />
                  <Input id="sp-count" className="num w-24" type="number" min="1" max="4096" step="1" value={count} onChange={(e) => update({ count: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="flex justify-between text-xs text-muted-foreground">
                  Online hours / day <span className="num text-foreground">{hours} h</span>
                </Label>
                <Slider aria-label="Online hours per day" min={1} max={24} value={[Number(hours) || 1]} onValueChange={(v) => update({ hours: v[0] })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sp-price" className="text-xs text-muted-foreground">
                  Your price / spawner
                </Label>
                <Input id="sp-price" className="num" type="number" min="0" step="0.01" placeholder="Enter price" value={purchase} onChange={(e) => update({ purchase: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="flex flex-col px-5 pt-4 pb-2">
            <div className="flex items-baseline justify-between pb-2">
              <h3 className="text-[15px] font-semibold">Drops</h3>
              <span className="text-xs text-muted-foreground">Rate 0 excludes a drop</span>
            </div>
            {drops.map((d) => {
              const item = byId.get(d.id)!
              const line = result.lines.find((l) => l.id === d.id)
              return (
                <div key={d.id} className="grid grid-cols-2 items-end gap-3 border-t border-border py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_7rem]">
                  <span className="col-span-2 flex items-center gap-2.5 pb-2 font-medium sm:col-span-1">
                    <ItemIcon item={item} size={24} /> {item.name}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`rate-${d.id}`} className="text-xs text-muted-foreground">
                      Per spawner / hour
                    </Label>
                    <Input id={`rate-${d.id}`} className="num" type="number" min="0" step="0.01" placeholder="Measured" value={d.rate} onChange={(e) => updateDrop(d.id, { rate: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`price-${d.id}`} className="text-xs text-muted-foreground">
                      Sell price
                    </Label>
                    <Input id={`price-${d.id}`} className="num" type="number" min="0" step="0.01" value={d.price} onChange={(e) => updateDrop(d.id, { price: e.target.value })} />
                  </div>
                  <span className="num col-span-2 pb-2 text-right text-sm text-muted-foreground sm:col-span-1">{fmt(line?.income ?? null)} / day</span>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Result label="Income / day" value={result.income} />
            <Result label="Per online hour" value={result.hourly} />
            <Result label="Payback" value={result.payback} suffix=" days" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
            <p className="text-sm text-muted-foreground">
              {!result.complete
                ? 'Enter a measured rate for every drop to see totals.'
                : result.income === 0
                  ? 'No income at these inputs. Payback needs positive income.'
                  : 'Uses your rates and prices. Re-measure when you change stack size.'}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setInputs(Object.fromEntries(Object.entries(inputs).filter(([k]) => k !== type.id)))}>
              <RotateCcw className="size-3.5" /> Reset {type.name}
            </Button>
          </div>
        </Card>
      </div>

      <details className="group rounded-xl border border-border bg-card px-5 py-4">
        <summary className="cursor-pointer font-medium">How this is calculated</summary>
        <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
          <p>Daily income = spawner count × online hours × Σ(measured rate per spawner per hour × selling price). Payback = count × price per spawner ÷ daily income.</p>
          <p>Drop prices are prefilled from the public snapshot ({snapshotTime}) and can be edited. Spawner purchase prices aren&apos;t verified. Storage limits, downtime and unsold stock aren&apos;t modeled. No production curve is copied between mob types.</p>
          <p>
            Types and outputs:{' '}
            <a className="text-primary hover:underline" href="https://donut.today/wiki/spawners" target="_blank" rel="noopener noreferrer">
              community guide ↗
            </a>
            ,{' '}
            <a className="text-primary hover:underline" href="https://donutpedia.wiki/wiki/Spawner" target="_blank" rel="noopener noreferrer">
              Donutpedia ↗
            </a>
            .
          </p>
        </div>
      </details>
    </div>
  )
}

function Result({ label, value, suffix = '' }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      {value == null ? (
        <span className="num text-3xl font-medium text-muted-foreground">—</span>
      ) : (
        <AnimatedNumber key={Math.round(value * 100)} value={value} format={(n) => fmt(n) + suffix} className="text-3xl font-medium text-ember" />
      )}
    </div>
  )
}
