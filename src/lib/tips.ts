export const TIP_USERNAME = 'ninianate'
export const TIP_PRESETS = [10000, 100000, 1000000] as const

/** Only a positive, whole amount may become part of a Minecraft command. */
export function tipCommand(raw: string): string | null {
  const value = raw.trim()
  if (!/^\d+$/.test(value)) return null
  const amount = Number(value)
  return Number.isSafeInteger(amount) && amount > 0 ? `/pay ${TIP_USERNAME} ${amount}` : null
}
