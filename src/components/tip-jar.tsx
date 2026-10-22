import { motion } from 'motion/react'
import { Lock } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* Ported from the tip jar Nathan added to the previous site. Payments are intentionally unconnected. */
export function TipJarButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label="Tip jar — coming soon"
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
      <small className="border-l border-ember/30 pl-2 text-[10px] font-normal text-ember/80 max-xl:hidden">Soon</small>
    </button>
  )
}

export function TipJarDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] gap-0 bg-[radial-gradient(ellipse_at_50%_20%,#3a2e2455,transparent_55%),var(--popover)] p-7 text-center sm:p-8">
        <p className="text-left text-[10px] font-medium tracking-[0.12em] text-muted-foreground">A LITTLE SUPPORT GOES A LONG WAY</p>
        <div className="mx-auto mt-2 mb-3 size-36 text-ember" aria-hidden="true">
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
          <i className="size-1.5 rounded-full bg-current" /> COMING SOON
        </span>
        <DialogTitle className="mt-3 mb-3 font-heading text-3xl font-bold">A tip for the tracker.</DialogTitle>
        <DialogDescription className="mx-auto max-w-80 text-sm leading-relaxed">
          If Donut Tracker helps you find your next move, you’ll soon be able to leave a little support.
        </DialogDescription>
        <p className="flex items-center justify-center gap-2 py-5 text-xs text-muted-foreground">
          <Lock className="size-3.5" /> Payments aren’t connected yet.
        </p>
        <Button disabled className="h-11 w-full disabled:opacity-100 disabled:bg-secondary disabled:text-muted-foreground">
          Tips open soon <span aria-hidden="true" className="text-lg text-ember">♡</span>
        </Button>
        <DialogClose asChild>
          <button type="button" className="mx-auto mt-5 text-xs text-muted-foreground hover:text-ember">
            Back to the tracker ↗
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
