import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { asset } from '@/data/catalog.ts'
import type { Item } from '@/lib/types.ts'
import { ItemIcon } from './bits'

interface Flight {
  left: number
  top: number
  x: number
  y: number
  rotate: number
}

/** Artwork flies in an isolated viewport layer, then hands off to its real card. */
export function InvestmentArrival({ item, index }: { item: Item; index: number }) {
  const stage = useRef<HTMLSpanElement>(null)
  const artwork = useRef<HTMLSpanElement>(null)
  const visible = useInView(stage, { once: true, amount: 0.35 })
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<'waiting' | 'flying' | 'landed'>(reduce ? 'landed' : 'waiting')
  const [flight, setFlight] = useState<Flight | null>(null)

  useEffect(() => {
    if (reduce) { setPhase('landed'); setFlight(null); return }
    if (!visible) return
    let cancelled = false
    let frame = 0
    let failSafe = 0
    const land = () => { if (!cancelled) { setPhase('landed'); setFlight(null) } }
    const image = new Image()
    image.src = asset(item.icon!)
    const ready = image.decode().catch(() => undefined)
    // Let the page transition finish so the measured card is in its final position.
    const timer = window.setTimeout(() => {
      void ready.then(() => {
        if (cancelled) return
        frame = requestAnimationFrame(() => {
          if (!stage.current || cancelled) return
          const rect = stage.current.getBoundingClientRect()
          if (rect.bottom < 0 || rect.top > innerHeight) { land(); return }
          const left = rect.left + (rect.width - 96) / 2
          const top = rect.top + (rect.height - 96) / 2
          const starts = [
            { left: -140, top: Math.max(80, top - 230), rotate: -32 },
            { left: innerWidth * 0.46, top: -150, rotate: 24 },
            { left: innerWidth + 100, top: Math.max(100, top - 170), rotate: 32 },
            { left: innerWidth + 120, top: Math.min(innerHeight - 140, top + 170), rotate: -38 },
          ]
          const start = starts[index]
          setFlight({ left, top, x: start.left - left, y: start.top - top, rotate: start.rotate })
          setPhase('flying')
          failSafe = window.setTimeout(land, 2600)
        })
      })
    }, 220)
    // Scrolling or resizing during a flight should never leave a detached image behind.
    window.addEventListener('scroll', land, { passive: true })
    window.addEventListener('resize', land, { passive: true })
    return () => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(failSafe)
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', land)
      window.removeEventListener('resize', land)
    }
  }, [visible, reduce, item.icon, index])

  // Run the flight directly: the route's initial={false} presence context must
  // not suppress either a first-load entrance or a later replay.
  useLayoutEffect(() => {
    if (!flight || !artwork.current || reduce) return
    const transform = (x: number, y: number, scale: number, rotate: number) => `translate3d(${x}px,${y}px,0) rotate(${rotate}deg) scale(${scale})`
    const animation = artwork.current.animate([
      { transform: transform(flight.x, flight.y, 1.7, flight.rotate), opacity: 0 },
      { transform: transform(flight.x * 0.2, -65, 1.2, flight.rotate * 0.18), opacity: 1, offset: 0.55 },
      { transform: transform(0, 5, 1.04, -2), opacity: 1, offset: 0.87 },
      { transform: transform(0, 0, 1, 0), opacity: 1 },
    ], { duration: 1250, delay: index * 160, easing: 'cubic-bezier(.2,.75,.2,1)', fill: 'backwards' })
    void animation.finished.then(() => { setPhase('landed'); setFlight(null) }).catch(() => undefined)
    return () => animation.cancel()
  }, [flight, index, reduce])

  const landed = phase === 'landed' || reduce
  return (
    <span ref={stage} className="relative grid h-36 place-items-center rounded-lg bg-surface" data-investment-arrival={item.id} data-arrival-state={phase}>
      <span style={{ opacity: landed ? 1 : 0 }}>
        <motion.span
          animate={landed && !reduce ? { y: [0, -5, 0] } : { y: 0 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.6 }}
          className="block transition-transform group-hover:scale-110 group-hover:-rotate-6"
        >
          <ItemIcon item={item} size={96} className="drop-shadow-[0_10px_10px_#0006]" />
        </motion.span>
      </span>
      {flight && !reduce && createPortal(
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true" data-investment-flight={item.id}>
          <span
            ref={artwork}
            className="absolute block size-24 will-change-transform"
            style={{ left: flight.left, top: flight.top }}
          >
            <img src={asset(item.icon!)} alt="" width="96" height="96" draggable={false} className={`size-24 object-contain drop-shadow-[0_16px_14px_#0008] ${item.flat ? 'pixelated' : ''}`} />
          </span>
        </div>, document.body,
      )}
    </span>
  )
}
