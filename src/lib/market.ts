import type { Craft, Grade, Item, Recipe } from './types.ts'

/** Source quote grades, most to least reliable. */
export const GRADES: Grade[] = ['S', 'A', 'B', 'C', 'D']
export const gradeRank = (g: Grade | null | undefined) => (g && GRADES.includes(g) ? GRADES.indexOf(g) : GRADES.length)

/** Cheapest fully priced recipe, with ingredient cost normalized by the recipe's output count. */
export function craft(d: Item, recipes: Record<string, Recipe[]>, byId: Map<string, Item>): Craft | null {
  const options = recipes[d.id]
  if (!options || d.price == null || !Number.isFinite(d.price)) return null
  let best: Craft | null = null
  for (const r of options) {
    let total = 0
    let grade = gradeRank(d.sourceGrade)
    const lines = []
    let valid = true
    for (const [id, count] of Object.entries(r.ingredients)) {
      const x = byId.get(id)
      if (!x || x.price == null || !Number.isFinite(x.price)) {
        valid = false
        break
      }
      total += x.price * count
      grade = Math.max(grade, gradeRank(x.sourceGrade))
      lines.push({ id, name: x.name, count, price: x.price })
    }
    if (!valid) continue
    const cost = total / r.yield
    if (!best || cost < best.cost) {
      best = { cost, yield: r.yield, lines, profit: d.price - cost, roi: ((d.price - cost) / cost) * 100, grade: GRADES[grade] ?? null }
    }
  }
  return best
}

export type CraftItem = Item & { recipe: Craft }

export function craftable(items: Item[], recipes: Record<string, Recipe[]>, byId: Map<string, Item>): CraftItem[] {
  return items.flatMap((d) => {
    const recipe = craft(d, recipes, byId)
    return recipe && recipe.cost > 0 ? [{ ...d, recipe }] : []
  })
}

export const matches = (d: Item, query: string) => {
  const hay = (d.name + ' ' + d.id).toLowerCase()
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t))
}

/** Sort that always keeps missing values last, whichever direction is chosen. */
export function sortBy<T extends Item>(data: T[], value: (d: T) => string | number | null | undefined, dir: 1 | -1): T[] {
  return data.slice().sort((a, b) => {
    const x = value(a)
    const y = value(b)
    if (x == null && y == null) return a.name.localeCompare(b.name)
    if (x == null) return 1
    if (y == null) return -1
    return (typeof x === 'string' ? x.localeCompare(String(y)) : x - (y as number)) * dir
  })
}

export const passesGrade = (grade: Grade | null | undefined, floor: Grade) => gradeRank(grade) <= gradeRank(floor)
