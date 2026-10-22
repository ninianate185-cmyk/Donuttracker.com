import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/* Adapted from Watermelon UI "pagination": controlled, themed, lucide icons, labelled buttons. */
export interface PaginationProps {
  totalPages: number;
  value: number;
  onChange: (page: number) => void;
}

const digitVariants = {
  initial: (dir: number) => ({ y: dir > 0 ? 16 : -16, opacity: 0, scale: 0.6, filter: 'blur(2px)' }),
  animate: { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: (dir: number) => ({ y: dir > 0 ? -16 : 16, opacity: 0, scale: 0.6, filter: 'blur(2px)' }),
};

const arrow =
  'flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function Pagination({ totalPages, value, onChange }: PaginationProps) {
  const [direction, setDirection] = React.useState(0);
  const digits = value.toString().split('');
  const [prevDigits, setPrevDigits] = React.useState<string[]>([]);
  const [prevTicks, setPrevTicks] = React.useState<number[]>([]);
  const len = digits.length;
  const lenDiff = len - prevDigits.length;
  const nextTicks = digits.map((digit, i) => {
    const prevI = i - lenDiff;
    const prevTick = prevI >= 0 ? (prevTicks[prevI] ?? 0) : 0;
    return digit !== (prevI >= 0 ? prevDigits[prevI] : undefined) ? prevTick + 1 : prevTick;
  });
  if (prevDigits.join('') !== digits.join('')) {
    setPrevTicks(nextTicks);
    setPrevDigits(digits);
  }

  const paginate = (dir: number) => {
    const next = Math.min(totalPages, Math.max(1, value + dir));
    if (next === value) return;
    setDirection(dir);
    onChange(next);
  };

  return (
    <nav aria-label="Pagination" className="flex items-center gap-2 rounded-full border border-border bg-surface p-1">
      <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => paginate(-1)} disabled={value === 1} className={arrow} aria-label="Previous page">
        <ArrowLeft className="size-4" />
      </motion.button>
      <div className="flex items-center px-1 text-sm font-medium text-muted-foreground select-none" aria-live="polite">
        <span className="sr-only">Page {value} of {totalPages}</span>
        <span className="flex h-6 items-center" aria-hidden="true">
          {digits.map((digit, index) => (
            <span key={`${index}-${len}`} className="relative h-6 w-[1ch] overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.span
                  key={nextTicks[index]}
                  custom={direction}
                  variants={digitVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 200, damping: 16, mass: 1.2 }}
                  className="num absolute inset-0 flex items-center justify-center text-foreground"
                >
                  {digit}
                </motion.span>
              </AnimatePresence>
            </span>
          ))}
        </span>
        <span className="num ml-1" aria-hidden="true">/ {totalPages}</span>
      </div>
      <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => paginate(1)} disabled={value === totalPages} className={arrow} aria-label="Next page">
        <ArrowRight className="size-4" />
      </motion.button>
    </nav>
  );
}
