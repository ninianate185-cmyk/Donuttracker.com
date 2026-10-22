import { createContext, useContext } from 'react'

export interface AppActions {
  openItem: (id: string) => void
  openSearch: () => void
  openSources: () => void
}

export const AppContext = createContext<AppActions | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppContext>')
  return ctx
}
