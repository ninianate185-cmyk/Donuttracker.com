import raw from './catalog.json'
import { craftable } from '@/lib/market.ts'
import type { Catalog, Item } from '@/lib/types.ts'

const catalog = raw as unknown as Catalog

export const META = catalog.meta
export const ITEMS: Item[] = catalog.items
export const RECIPES = catalog.recipes
export const ALTERNATES = catalog.alternates
export const SPAWNERS = catalog.spawners.types
export const byId = new Map(ITEMS.map((d) => [d.id, d]))
export const CRAFTS = craftable(ITEMS, RECIPES, byId)

export const item = (id: string) => byId.get(id)

export const snapshotTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
}).format(new Date(META.sourceTime))

export const CATEGORIES = ['Blocks', 'Materials', 'Equipment', 'Collectibles', 'Consumables', 'Redstone', 'DonutSMP', 'Server variants']

export const FEATURED = ['elytra', 'dragon_head', 'piglin_head', 'enchanted_golden_apple']
export const MATERIALS = ['netherite_ingot', 'diamond', 'gold_ingot', 'bone_block']

export const asset = (path: string) => `./assets/${path}`
