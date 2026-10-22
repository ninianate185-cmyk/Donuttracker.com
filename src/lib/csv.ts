import type { Item, SalesSample } from './types.ts'

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/)
  const split = (l: string) =>
    (l.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g) || [])
      .filter((x) => x !== '')
      .map((x) => x.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'))
  const heads = split(lines.shift() ?? '')
  return lines.map((l) => Object.fromEntries(split(l).map((v, i) => [heads[i], v])))
}

const day = (time: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(time))

/** Volume-weighted October means from a user's own sales sample (Oct 1–21, 2026, Pacific time). */
export function aggregateSales(rows: Record<string, string>[], find: (raw: string) => Item | undefined) {
  const out: Record<string, SalesSample> = {}
  let invalid = 0
  for (const r of rows) {
    const raw = String(r.item || '').replace(/^minecraft:/, '')
    const d = find(raw)
    const price = Number(r.unitPrice)
    const qty = Number(r.quantity)
    const ts = String(r.timestamp || '')
    const time = Date.parse(ts)
    if (!d || !Number.isFinite(price) || price <= 0 || !Number.isSafeInteger(qty) || qty <= 0 || !/(Z|[+-]\d\d:\d\d)$/.test(ts) || !Number.isFinite(time)) {
      invalid++
      continue
    }
    const date = day(time)
    if (date < '2026-10-01' || date > '2026-10-21') {
      invalid++
      continue
    }
    const a = (out[d.id] ??= { total: 0, quantity: 0, transactions: 0, first: date, last: date, average: 0 })
    a.total += price * qty
    a.quantity += qty
    a.transactions++
    if (date < a.first) a.first = date
    if (date > a.last) a.last = date
  }
  for (const a of Object.values(out)) a.average = a.total / a.quantity
  return { samples: out, invalid }
}
