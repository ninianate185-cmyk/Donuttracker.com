import { useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { asset, byId } from '@/data/catalog.ts'
import type { SpawnerType } from '@/lib/types.ts'
import { cn } from '@/lib/utils'

/** Pointer/keyboard tilt on a spring; click or Enter throws a burst of embers. */
export function SpawnerStage({ type, compact = false }: { type: SpawnerType; compact?: boolean }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateY = useSpring(useTransform(x, [-1, 1], [-14, 14]), { stiffness: 140, damping: 16 })
  const rotateX = useSpring(useTransform(y, [-1, 1], [10, -10]), { stiffness: 140, damping: 16 })
  const [bursts, setBursts] = useState<number[]>([])
  const skeleton = type.id === 'skeleton'
  const mob = byId.get(type.icon)

  const burst = () => {
    if (reduce) return
    const id = Date.now()
    setBursts((b) => [...b.slice(-2), id])
    setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 1400)
  }

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={`${type.name} spawner. Move the pointer or use arrow keys to tilt; press Enter for embers.`}
      className="relative grid h-full w-full cursor-grab place-items-center overflow-hidden outline-none [perspective:900px] focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        x.set(((e.clientX - r.left) / r.width) * 2 - 1)
        y.set(((e.clientY - r.top) / r.height) * 2 - 1)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
      onClick={burst}
      onKeyDown={(e) => {
        const step = 0.25
        if (e.key === 'ArrowLeft') x.set(Math.max(-1, x.get() - step))
        else if (e.key === 'ArrowRight') x.set(Math.min(1, x.get() + step))
        else if (e.key === 'ArrowUp') y.set(Math.max(-1, y.get() - step))
        else if (e.key === 'ArrowDown') y.set(Math.min(1, y.get() + step))
        else if (e.key === 'Enter' || e.key === ' ') burst()
        else return
        e.preventDefault()
      }}
    >
      <div aria-hidden="true" className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,#ffb54755,#ff7aa82a_45%,transparent_70%)] blur-xl" />
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="relative">
        {skeleton ? (
          <img src={asset('spawner.png')} alt="Skeleton spawner" width={1402} height={1122} draggable={false} className={cn('h-auto drop-shadow-[0_30px_25px_#0007]', compact ? 'w-[300px]' : 'w-[min(420px,80vw)]')} />
        ) : (
          <div className={cn('relative grid aspect-square place-items-center', compact ? 'w-56' : 'w-[min(300px,70vw)]')}>
            {mob?.icon && (
              <motion.img
                src={asset(mob.icon)}
                alt=""
                draggable={false}
                animate={reduce ? undefined : { rotateY: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className={cn('absolute top-[28%] left-[28%] size-[44%] object-contain brightness-125 drop-shadow-[0_0_12px_#ffb54799]', mob.flat && 'pixelated')}
              />
            )}
            <img src={asset('renders/spawner.png')} alt={`${type.name} spawner`} width={256} height={256} draggable={false} className="pixelated relative size-full drop-shadow-[0_22px_17px_#0009]" />
          </div>
        )}
      </motion.div>
      {bursts.map((id) => (
        <div key={id} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[30%] flex justify-center">
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              className="absolute size-1.5 rounded-[1px] bg-ember shadow-[0_0_8px_var(--ember)]"
              style={{ left: `calc(50% + ${(i - 7) * 9}px)`, animation: `ember-rise ${0.8 + (i % 4) * 0.15}s ease-out forwards`, ['--dx' as string]: `${(i - 7) * 6}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
