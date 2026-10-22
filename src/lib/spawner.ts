export type Amount = string | number | null | undefined

export function inputAmount(value: Amount): number | null {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export interface DropInput {
  id?: string
  rate: Amount
  price: Amount
}

export interface Estimate {
  income: number | null
  hourly: number | null
  payback: number | null
  lines: (DropInput & { income: number | null })[]
  complete: boolean
}

/** Missing rates never become zero; an explicit zero rate excludes that drop. */
export function spawnerEstimate(count: Amount, hours: Amount, purchase: Amount, drops: DropInput[]): Estimate {
  const n = inputAmount(count)
  const h = inputAmount(hours)
  const p = inputAmount(purchase)
  if (n === null || n < 1 || !Number.isInteger(n) || h === null || h <= 0 || h > 24 || !drops.length) {
    return { income: null, hourly: null, payback: null, lines: [], complete: false }
  }
  let hourly = 0
  let complete = true
  const lines = drops.map((drop) => {
    const rate = inputAmount(drop.rate)
    const price = inputAmount(drop.price)
    if (rate === null || (rate > 0 && price === null)) {
      complete = false
      return { ...drop, income: null }
    }
    hourly += n * rate * (price ?? 0)
    return { ...drop, income: n * h * rate * (price ?? 0) }
  })
  const income = complete ? hourly * h : null
  return {
    income,
    hourly: complete ? hourly : null,
    payback: complete && income! > 0 && p !== null && p > 0 ? (n * p) / income! : null,
    lines,
    complete,
  }
}
