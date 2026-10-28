import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination } from '@/components/pagination'
import { Change, GradeBadge, ItemIcon, PageHead, Price, WatchButton } from '@/components/bits'
import { useApp } from '@/app-context.tsx'
import { CATEGORIES, ITEMS, META, snapshotTime } from '@/data/catalog.ts'
import { GRADES, matches, sortBy } from '@/lib/market.ts'
import { num } from '@/lib/format.ts'
import type { Grade, Item } from '@/lib/types.ts'
import { cn } from '@/lib/utils'

type SortKey = 'name' | 'price' | 'change'
const counts = Object.fromEntries(CATEGORIES.map((c) => [c, ITEMS.filter((d) => d.category === c).length]))
const gradeCounts = Object.fromEntries(GRADES.map((g) => [g, ITEMS.filter((d) => d.price != null && d.sourceGrade === g).length]))

export default function Market() {
  const { openItem } = useApp()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const [category, setCategory] = useState('All')
  const [grades, setGrades] = useState<Grade[]>([...GRADES])
  const [pricedOnly, setPricedOnly] = useState(false)
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [sort, setSort] = useState<SortKey>('name')
  const [dir, setDir] = useState<1 | -1>(1)
  const [size, setSize] = useState(40)
  const [page, setPage] = useState(1)
  const invalidRange = min !== '' && max !== '' && Number(min) > Number(max)

  const rows = useMemo(() => {
    const lo = min ? +min : -Infinity
    const hi = max ? +max : Infinity
    const filtered = ITEMS.filter(
      (d) =>
        matches(d, query) &&
        (category === 'All' || d.category === category) &&
        (!pricedOnly || d.price != null) &&
        (d.price == null ? !min && !max : d.price >= lo && d.price <= hi && (!d.sourceGrade || grades.includes(d.sourceGrade))),
    )
    return sortBy(filtered, (d: Item) => (sort === 'name' ? d.name : d[sort]), dir)
  }, [query, category, grades, pricedOnly, min, max, sort, dir])

  const pages = Math.max(1, Math.ceil(rows.length / size))
  const current = Math.min(page, pages)
  const slice = rows.slice((current - 1) * size, current * size)
  const reset = (fn: () => void) => {
    fn()
    setPage(1)
  }
  const sortOn = (key: SortKey) =>
    reset(() => {
      setDir(sort === key ? (dir === 1 ? -1 : 1) : key === 'name' ? 1 : -1)
      setSort(key)
    })

  return (
    <div className="flex flex-col gap-7">
      <PageHead
        title="Item catalog"
        description={`${num(META.catalogCount)} Minecraft Java 26.1 items plus ${num(ITEMS.length - META.catalogCount)} server items and variants. Missing prices stay blank.`}
        action={<span className="rounded-full px-3 py-1 text-xs text-muted-foreground ring-1 ring-border">Snapshot · {snapshotTime}</span>}
      />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <Card className="gap-5 p-4 lg:sticky lg:top-28 lg:w-64 lg:shrink-0" aria-label="Filters">
          <div className="flex flex-col gap-0.5">
            <span className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">Category</span>
            <div className="flex flex-wrap gap-1 lg:flex-col">
              {['All', ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => reset(() => setCategory(c))}
                  className={cn(
                    'relative flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
                    category === c ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {category === c && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-md bg-secondary ring-1 ring-border" />}
                  <span className="relative">{c}</span>
                  <span className="num relative text-xs text-muted-foreground">{num(c === 'All' ? ITEMS.length : counts[c])}</span>
                </button>
              ))}
            </div>
          </div>
          <fieldset className="flex flex-col gap-2 px-2">
            <legend className="pb-2 text-xs font-medium text-muted-foreground">Quote grade</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2 lg:flex-col">
              {GRADES.map((g) => (
                <Label key={g} className="flex items-center gap-2 text-sm font-normal">
                  <Checkbox checked={grades.includes(g)} onCheckedChange={(v) => reset(() => setGrades(v ? [...grades, g] : grades.filter((x) => x !== g)))} />
                  <GradeBadge grade={g} /> <span className="num text-xs text-muted-foreground">{num(gradeCounts[g])}</span>
                </Label>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-2 px-2">
            <legend className="pb-2 text-xs font-medium text-muted-foreground">Price range</legend>
            <div className="grid grid-cols-2 gap-2">
              <Input aria-label="Minimum price" aria-invalid={invalidRange} aria-describedby={invalidRange ? 'market-range-error' : undefined} className="num" type="number" min="0" placeholder="Min" value={min} onChange={(e) => reset(() => setMin(e.target.value))} />
              <Input aria-label="Maximum price" aria-invalid={invalidRange} aria-describedby={invalidRange ? 'market-range-error' : undefined} className="num" type="number" min="0" placeholder="Max" value={max} onChange={(e) => reset(() => setMax(e.target.value))} />
            </div>
            {invalidRange && <p id="market-range-error" role="alert" className="text-xs text-down">Maximum price must be at least the minimum.</p>}
          </fieldset>
          <Label className="flex items-center gap-2 px-2 text-sm font-normal">
            <Checkbox checked={pricedOnly} onCheckedChange={(v) => reset(() => setPricedOnly(!!v))} /> Only items with a quote
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              reset(() => {
                setCategory('All')
                setGrades([...GRADES])
                setPricedOnly(false)
                setMin('')
                setMax('')
                setParams({})
              })
            }
          >
            Reset filters
          </Button>
        </Card>

        <Card className="min-w-0 flex-1 gap-0 p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Filter items"
                className="pl-9"
                placeholder="Filter by name or Minecraft ID…"
                value={query}
                onChange={(e) => reset(() => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true }))}
              />
            </div>
            <Select value={sort} onValueChange={(v) => reset(() => { setSort(v as SortKey); setDir(v === 'name' ? 1 : -1) })}>
              <SelectTrigger className="w-40" aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="price">Highest price</SelectItem>
                <SelectItem value="change">7d change</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader className="sticky top-0">
              <TableRow>
                <TableHead className="pl-4">
                  <SortButton active={sort === 'name'} dir={dir} onClick={() => sortOn('name')}>Item</SortButton>
                </TableHead>
                <TableHead className="max-md:hidden">Category</TableHead>
                <TableHead className="text-right">
                  <SortButton active={sort === 'price'} dir={dir} onClick={() => sortOn('price')} right>Quote</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton active={sort === 'change'} dir={dir} onClick={() => sortOn('change')} right>7d</SortButton>
                </TableHead>
                <TableHead className="text-right max-sm:hidden">Grade</TableHead>
                <TableHead className="text-right max-md:hidden">Stack</TableHead>
                <TableHead className="w-10 pr-3">
                  <span className="sr-only">Save</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => (
                <motion.tr
                  key={d.id}
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="cursor-pointer border-b border-border transition-colors hover:bg-accent/60"
                  onClick={() => openItem(d.id)}
                >
                  <TableCell className="pl-4">
                    <button type="button" className="flex items-center gap-3 text-left" onClick={() => openItem(d.id)}>
                      <ItemIcon item={d} size={30} />
                      <span className="flex flex-col">
                        <span className="font-medium">{d.name}</span>
                        <span className="num text-[11px] text-muted-foreground">{d.variantNote ? 'Check variant in game' : d.id}</span>
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-md:hidden">{d.category}</TableCell>
                  <TableCell className="text-right font-medium">
                    <Price item={d} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Change value={d.change} />
                  </TableCell>
                  <TableCell className="text-right max-sm:hidden">
                    <GradeBadge grade={d.sourceGrade} />
                  </TableCell>
                  <TableCell className="num text-right text-muted-foreground max-md:hidden">{d.stack ?? '—'}</TableCell>
                  <TableCell className="pr-3">
                    <WatchButton item={d} />
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
          {!slice.length && (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <p className="font-medium">No matching items</p>
              <p className="text-sm text-muted-foreground">Try another search, category or grade.</p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3">
            <span className="text-sm text-muted-foreground">
              {rows.length ? `${num((current - 1) * size + 1)}–${num(Math.min(current * size, rows.length))} of ${num(rows.length)}` : '0 entries'}
            </span>
            <div className="flex items-center gap-3">
              <Select value={String(size)} onValueChange={(v) => reset(() => setSize(+v))}>
                <SelectTrigger size="sm" className="w-28" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[20, 40, 80].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Pagination totalPages={pages} value={current} onChange={setPage} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function SortButton({ active, dir, onClick, children, right }: { active: boolean; dir: 1 | -1; onClick: () => void; children: React.ReactNode; right?: boolean }) {
  const Icon = dir === 1 ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Sort by ${children}${active ? (dir === 1 ? ', ascending' : ', descending') : ''}`}
      className={cn('inline-flex items-center gap-1 hover:text-foreground', active && 'text-foreground', right && 'flex-row-reverse')}
    >
      {children}
      <Icon className={cn('size-3', !active && 'opacity-0')} />
    </button>
  )
}
