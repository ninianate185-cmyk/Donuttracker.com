export type Grade = 'S' | 'A' | 'B' | 'C' | 'D'

export interface Item {
  id: string
  name: string
  category: string
  stack: number | null
  icon: string | null
  cube?: boolean
  animated?: boolean
  rendered?: boolean
  flat?: boolean
  price: number | null
  change: number | null
  monthlyAverage: null
  source: string | null
  sourceTime: string | null
  priceType?: 'Auction house' | 'Buy order'
  sourceGrade?: Grade | null
  rounded?: boolean
  variantNote: string | null
}

export interface Recipe {
  yield: number
  ingredients: Record<string, number>
}

export interface SpawnerType {
  id: string
  name: string
  icon: string
  drops: string[]
  notes: string
}

export interface Alternate {
  price: number
  source: string
  observedOn: string
}

export interface Catalog {
  meta: {
    catalogVersion: string
    catalogCount: number
    source: string
    sourceTime: string
    retrievedOn: string
    retrievedAt: string
    priceCount: number
    monthlyCoverage: number
    notes: string
  }
  items: Item[]
  recipes: Record<string, Recipe[]>
  alternates: Record<string, Alternate>
  spawners: { types: SpawnerType[] }
}

export interface CraftLine {
  id: string
  name: string
  count: number
  price: number
}

export interface Craft {
  cost: number
  yield: number
  lines: CraftLine[]
  profit: number
  roi: number
  grade: Grade | null
}

export interface Plan {
  id: string
  buy: number
  sell: number
  qty: number
  fee?: number
  profit: number
  method: string
  created: string
}

export interface SalesSample {
  total: number
  quantity: number
  transactions: number
  first: string
  last: string
  average: number
}
