import { motion } from 'motion/react'
import { Lock } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const TIP_USERNAME = 'ninianate'

/* Shares the recipient's username; payments happen in Minecraft. */
export function TipJarButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label="Tip jar"
      className={cn(
        'group flex h-9 items-center gap-2 rounded-lg border border-ember/35 bg-ember/5 px-2.5 text-xs font-medium text-ember transition hover:-translate-y-0.5 hover:border-ember/70 hover:bg-ember/10',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-[18px] transition-transform group-hover:-rotate-8">
        <path d="M8 7V4h8v3M7 7h10l2 4v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8l2-4Z" />
        <path d="M9 14c-2-3-5 1 3 5 8-4 5-8 3-5l-3 2-3-2Z" transform="translate(0 -2) scale(1 .95)" />
      </svg>
      <span className="whitespace-nowrap max-xl:sr-only">Tip jar</span>
    </button>
  )
}

export function TipJarDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto bg-[radial-gradient(ellipse_at_50%_20%,#3a2e2455,transparent_55%),var(--popover)] p-6 text-center sm:max-w-[460px]">
        <div className="mx-auto mb-2 size-12 text-ember" aria-hidden="true">
          <svg viewBox="0 0 160 160" fill="none" className="size-full overflow-visible">
            <ellipse cx="80" cy="139" rx="44" ry="6" fill="currentColor" opacity=".08" />
            <motion.g initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.25, 1] }}>
              <circle cx="80" cy="29" r="14" fill="#f3a065" />
              <circle cx="80" cy="29" r="10" stroke="#583820" strokeWidth="1.5" />
              <path d="M77 24h6v10h-6z" stroke="#583820" strokeWidth="1.5" />
            </motion.g>
            <path d="M57 58v-8h46v8m-43 0h40l12 15v52a9 9 0 0 1-9 9H57a9 9 0 0 1-9-9V73l12-15Z" fill="#2a231d" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M67 58h26M58 77v44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".35" />
            <path d="M80 113s-20-11-20-23a11 11 0 0 1 20-6 11 11 0 0 1 20 6c0 12-20 23-20 23Z" fill="var(--primary)" />
            <path d="M32 73v8m-4-4h8m91 30v6m-3-3h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".5" />
          </svg>
        </div>
        <span className="inline-flex items-center justify-center gap-2 text-[10px] font-medium tracking-[0.16em] text-ember">
          <i className="size-1.5 rounded-full bg-current" /> SUPPORT IN GAME
        </span>
        <DialogTitle className="mt-2 mb-2 font-heading text-3xl font-semibold">A tip for the tracker.</DialogTitle>
        <DialogDescription className="mx-auto max-w-80 text-sm leading-relaxed">
          To donate, pay <span className="font-medium text-foreground">{TIP_USERNAME}</span> in-game on Donut SMP.
        </DialogDescription>
        <div className="mt-5 rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">Minecraft username</p>
          <p className="num mt-1 select-all text-2xl font-medium">{TIP_USERNAME}</p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><Lock className="size-3.5" />Cash tips · coming soon</div>
        <DialogClose asChild>
          <button type="button" className="mx-auto mt-4 text-xs text-muted-foreground hover:text-ember">
            Back to the tracker ↗
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
