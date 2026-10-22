import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ITEMS, META, byId, snapshotTime } from '@/data/catalog.ts'
import { aggregateSales, parseCSV } from '@/lib/csv.ts'
import { num } from '@/lib/format.ts'
import { KEYS, useStored } from '@/lib/store.ts'
import type { SalesSample } from '@/lib/types.ts'

const SOURCES = [
  { href: 'https://github.com/PrismarineJS/minecraft-data', name: 'Minecraft catalog & recipes', note: 'PrismarineJS minecraft-data · Java 26.1 registry · MIT license' },
  { href: 'https://donutsmpterminal.com/all_items', name: 'DonutSMP Terminal market quotes', note: `${num(META.priceCount)} rounded public quotes. Snapshot ${snapshotTime}. Seven-day change reported by the source.` },
  { href: 'https://donut.auction', name: 'Donut.Auction alternate values', note: '25 separately attributed observations. Transaction history may be incomplete; not October averages.' },
  { href: 'https://api.donutsmp.net', name: 'Official Donut SMP API', note: 'Requires an authorized key. None is included in this site.' },
]

export function SourcesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [, setHistory] = useStored<Record<string, SalesSample>>(KEYS.history, {})
  const file = useRef<HTMLInputElement>(null)

  async function importFile(f: File) {
    try {
      const { samples, invalid } = aggregateSales(parseCSV(await f.text()), (raw) => byId.get(raw) ?? ITEMS.find((d) => d.name.toLowerCase() === raw.toLowerCase()))
      const count = Object.keys(samples).length
      if (!count) return toast('No valid October sales found. Check CSV columns and dated timestamps.')
      setHistory((h) => ({ ...h, ...samples }))
      onOpenChange(false)
      toast(`October sample averages imported for ${count} items. ${invalid} rows skipped.`)
    } catch {
      toast('Could not read the CSV. Use item, unitPrice, quantity, timestamp columns.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Sources &amp; coverage</DialogTitle>
          <DialogDescription>
            All {num(META.catalogCount)} Minecraft Java 26.1 items plus identified server items. Server availability isn&apos;t guaranteed for every vanilla item.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {SOURCES.map((s) => (
            <li key={s.href} className="rounded-lg border border-border p-3">
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
                {s.name} ↗
              </a>
              <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 rounded-lg bg-surface p-3 text-sm">
          <p>A verified month-to-date average needs dated transactions. Import your own October sales to compute volume-weighted averages from that sample.</p>
          <p className="text-xs text-muted-foreground">Columns: item, unitPrice, quantity, timestamp. Item is a Minecraft ID or exact name. Timestamps need a timezone. Only Oct 1–21, 2026 sales count. Stays in this browser.</p>
          <input ref={file} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
          <Button variant="outline" className="self-start" onClick={() => file.current?.click()}>
            <Upload className="size-4" /> Import sales CSV
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Item art: native inventory renders by Owen1212055/mc-assets. The skeleton spawner illustration is AI-generated.
        </p>
      </DialogContent>
    </Dialog>
  )
}
