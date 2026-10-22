import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Calculator, Hammer, LayoutGrid, Star, TrendingUp, Gem } from 'lucide-react'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/components/ui/command'
import { ITEMS } from '@/data/catalog.ts'
import { fmt } from '@/lib/format.ts'
import { matches } from '@/lib/market.ts'
import { ItemIcon } from './bits'

const PAGES = [
  { to: '/', label: 'Overview', icon: LayoutGrid },
  { to: '/market', label: 'Market', icon: TrendingUp },
  { to: '/flips', label: 'Flips', icon: Hammer },
  { to: '/spawners', label: 'Spawner calculator', icon: Calculator },
  { to: '/investments', label: 'Investments', icon: Gem },
  { to: '/watchlist', label: 'Watchlist & plans', icon: Star },
]

export function CommandMenu({ open, onOpenChange, onItem }: { open: boolean; onOpenChange: (open: boolean) => void; onItem: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  // cmdk's own fuzzy filter is too slow for 1,595 rows; filter here and cap results.
  const results = useMemo(() => (query.trim() ? ITEMS.filter((d) => matches(d, query)).slice(0, 8) : []), [query])
  const pages = PAGES.filter((p) => !query.trim() || p.label.toLowerCase().includes(query.trim().toLowerCase()))
  const close = () => {
    onOpenChange(false)
    setQuery('')
  }
  return (
    <CommandDialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())} title="Search" description="Find an item or jump to a page">
      <Command shouldFilter={false}>
      <CommandInput placeholder="Search items or pages…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No matching items.</CommandEmpty>
        {results.length > 0 && (
          <CommandGroup heading="Items">
            {results.map((d) => (
              <CommandItem
                key={d.id}
                value={d.id}
                onSelect={() => {
                  close()
                  onItem(d.id)
                }}
              >
                <ItemIcon item={d} size={22} />
                <span className="flex-1 truncate">{d.name}</span>
                <span className="num text-xs text-muted-foreground">{d.price == null ? 'No quote' : fmt(d.price)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {pages.length > 0 && (
        <CommandGroup heading="Go to">
          {pages.map((p) => (
            <CommandItem
              key={p.to}
              value={'page:' + p.to}
              onSelect={() => {
                close()
                navigate(p.to)
              }}
            >
              <p.icon className="size-4" />
              {p.label}
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        )}
      </CommandList>
      </Command>
    </CommandDialog>
  )
}
