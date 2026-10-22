const UNITS: [number, string][] = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']]

/** Compact value with three significant digits so neighbouring figures share one precision. */
export function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (Math.abs(n) < 1e3) return String(+n.toFixed(2))
  let i = UNITS.findIndex(([v]) => Math.abs(n) >= v)
  let v = +(n / UNITS[i][0]).toPrecision(3)
  if (Math.abs(v) >= 1e3 && i > 0) {
    i--
    v = +(n / UNITS[i][0]).toPrecision(3)
  }
  return v + UNITS[i][1]
}

export const signed = (n: number) => (n > 0 ? '+' : '') + fmt(n)

export const pct = (n: number) => (Math.abs(n) >= 1e3 ? Math.round(n).toLocaleString('en-US') : n.toFixed(1)) + '%'

export const signedPct = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? '—' : (n > 0 ? '+' : '') + pct(n))

export const num = (n: number | null | undefined) => (n != null && Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '—')
