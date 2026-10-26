import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { asset } from '@/data/catalog.ts'
import { fmt, signedPct } from '@/lib/format.ts'
import { KEYS, useStored } from '@/lib/store.ts'
import type { Grade, Item } from '@/lib/types.ts'
import { cn } from '@/lib/utils'

export function ItemIcon({ item, size = 32, className }: { item: Item | undefined; size?: number; className?: string }) {
  if (!item?.icon)
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size }}
        className={cn('grid shrink-0 place-items-center rounded-md border border-border bg-muted font-heading text-muted-foreground', className)}
      >
        {item?.name[0] ?? '?'}
      </span>
    )
  return (
    <img
      src={asset(item.icon)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      style={{ width: size, height: size }}
      className={cn('shrink-0 object-contain', (item.flat || !item.rendered) && 'pixelated', className)}
    />
  )
}

export function GradeBadge({ grade, className }: { grade: Grade | null | undefined; className?: string }) {
  if (!grade) return <span className="text-muted-foreground">—</span>
  const weak = grade === 'C' || grade === 'D'
  return (
    <span
      title={`Source quote grade ${grade}${weak ? ' — thin or unreliable listing' : ''}`}
      className={cn(
        'num inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
        grade === 'S' && 'bg-ember/15 text-ember ring-1 ring-ember/40',
        (grade === 'A' || grade === 'B') && 'bg-secondary text-foreground ring-1 ring-border',
        weak && 'text-muted-foreground ring-1 ring-dashed ring-border',
        className,
      )}
    >
      {grade}
    </span>
  )
}

export function Change({ value, className }: { value: number | null | undefined; className?: string }) {
  if (value == null) return <span className={cn('num text-muted-foreground', className)}>—</span>
  return <span className={cn('num', value > 0 ? 'text-up' : value < 0 ? 'text-down' : 'text-muted-foreground', className)}>{signedPct(value)}</span>
}

export function Price({ item, className }: { item: Item; className?: string }) {
  if (item.price == null) return <span className={cn('text-muted-foreground', className)}>No quote</span>
  return (
    <span className={cn('num', className)} title={`${Math.round(item.price).toLocaleString('en-US')} in-game dollars; rounded public quote`}>
      {item.rounded ? '≈ ' : ''}
      {fmt(item.price)}
    </span>
  )
}

/** Counts up once when scrolled into view; static under reduced motion. */
export function AnimatedNumber({ value, format = (n: number) => Math.round(n).toLocaleString('en-US'), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)
  useEffect(() => {
    if (!inView || reduce) {
      setShown(value)
      return
    }
    const controls = animate(0, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1], onUpdate: setShown })
    return () => controls.stop()
  }, [inView, reduce, value])
  return (
    <span ref={ref} className={cn('num', className)}>
      {format(shown)}
    </span>
  )
}

export function useWatch() {
  const [ids, setIds] = useStored<string[]>(KEYS.watch, [])
  const toggle = (item: Item) => {
    const has = ids.includes(item.id)
    setIds(has ? ids.filter((x) => x !== item.id) : [...ids, item.id])
    toast(has ? `${item.name} removed from watchlist` : `${item.name} saved to watchlist`)
  }
  return { ids, has: (id: string) => ids.includes(id), toggle }
}

export function WatchButton({ item, className }: { item: Item; className?: string }) {
  const watch = useWatch()
  const saved = watch.has(item.id)
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? 'Remove' : 'Save'} ${item.name} ${saved ? 'from' : 'to'} watchlist`}
      onClick={(e) => {
        e.stopPropagation()
        watch.toggle(item)
      }}
      className={cn(
        'grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90',
        saved && 'text-ember',
        className,
      )}
    >
      <Star className="size-4" fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[15px] font-semibold tracking-tight">{children}</h2>
      {action}
    </div>
  )
}

export function PageHead({ title, description, action }: { title: string; description: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[2.125rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.75rem]">{title}</h1>
        <p className="max-w-2xl text-muted-foreground">{description}</p>
      </div>
      {action}
    </section>
  )
}
