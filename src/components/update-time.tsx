import { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { META } from '@/data/catalog.ts'
import { useApp } from '@/app-context.tsx'
import { timeAgo, timestamp } from '@/lib/time.ts'

export function UpdatedAt({ value, label = 'Updated' }: { value: string; label?: string }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(id)
  }, [])
  return <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"><Clock3 className="size-3.5 shrink-0" aria-hidden="true" /><span>{label}:</span><time dateTime={value} title={value} className="font-medium text-foreground">{timestamp(value)}</time><span>· {timeAgo(value, now)}</span></span>
}

export function MarketUpdate() {
  const { openSources } = useApp()
  return <aside aria-label="Market data freshness" className="mb-7 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-ember/25 bg-ember/5 px-4 py-3"><div className="flex flex-col gap-1"><UpdatedAt value={META.sourceTime} label="Last market update" /><p className="text-[11px] text-muted-foreground">Price snapshot · updates when a new source snapshot is imported. Not a live feed.</p></div><button type="button" onClick={openSources} className="shrink-0 text-xs text-ember underline-offset-4 hover:underline">Sources &amp; update details ↗</button></aside>
}
