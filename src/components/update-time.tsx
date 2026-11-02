import { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { META } from '@/data/catalog.ts'
import { useApp } from '@/app-context.tsx'
import { timeAgo, timestamp } from '@/lib/time.ts'
import { cn } from '@/lib/utils'

function useNow() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

export function UpdatedAt({ value, label = 'Updated' }: { value: string; label?: string }) {
  const now = useNow()
  return <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"><Clock3 className="size-3.5 shrink-0" aria-hidden="true" /><span>{label}:</span><time dateTime={value} title={value} className="font-medium text-foreground">{timestamp(value)}</time><span>· {timeAgo(value, now)}</span></span>
}

/** Compact freshness status: replaces the old full-width banner on every page. Opens Sources for details. */
export function MarketUpdate({ className }: { className?: string }) {
  const { openSources } = useApp()
  const now = useNow()
  return (
    <button
      type="button"
      onClick={openSources}
      title={`Last market update ${timestamp(META.sourceTime)}. Price snapshot, not a live feed. Click for sources.`}
      className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-ember/30 transition hover:bg-ember/10 hover:text-foreground', className)}
    >
      <span className="size-1.5 rounded-full bg-ember" aria-hidden="true" />
      <span>
        Snapshot · <time dateTime={META.sourceTime} className="font-medium text-foreground">{timeAgo(META.sourceTime, now).toLowerCase()}</time>
      </span>
      <span className="sr-only">, not a live feed. Open sources and update details.</span>
    </button>
  )
}
