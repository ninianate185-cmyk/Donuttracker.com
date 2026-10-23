import { useCallback, useMemo, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { MotionConfig } from 'motion/react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppContext } from '@/app-context.tsx'
import { AppShell } from '@/components/app-shell'
import { CommandMenu } from '@/components/command-menu'
import { ItemSheet } from '@/components/item-sheet'
import { SourcesDialog } from '@/components/sources-dialog'
import { TipJarDialog } from '@/components/tip-jar'
import Overview from '@/pages/overview'
import Market from '@/pages/market'
import Flips from '@/pages/flips'
import Spawners from '@/pages/spawners'
import Investments from '@/pages/investments'
import Watchlist from '@/pages/watchlist'
import Players from '@/pages/players'

export default function App() {
  const [itemId, setItemId] = useState<string | null>(null)
  const [search, setSearch] = useState(false)
  const [sources, setSources] = useState(false)
  const openItem = useCallback((id: string) => setItemId(id), [])
  const openSearch = useCallback(() => setSearch(true), [])
  const [tipJar, setTipJar] = useState(false)
  const openSources = useCallback(() => setSources(true), [])
  const openTipJar = useCallback(() => setTipJar(true), [])
  const actions = useMemo(() => ({ openItem, openSearch, openSources, openTipJar }), [openItem, openSearch, openSources, openTipJar])

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={200}>
        <HashRouter>
          <AppContext.Provider value={actions}>
            <AppShell>
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/market" element={<Market />} />
                <Route path="/flips" element={<Flips />} />
                <Route path="/spawners" element={<Spawners />} />
                <Route path="/investments" element={<Investments />} />
                <Route path="/players" element={<Players />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="*" element={<Overview />} />
              </Routes>
            </AppShell>
            <CommandMenu open={search} onOpenChange={setSearch} onItem={openItem} />
            <ItemSheet id={itemId} onOpenChange={(o) => !o && setItemId(null)} onItem={openItem} />
            <SourcesDialog open={sources} onOpenChange={setSources} />
            <TipJarDialog open={tipJar} onOpenChange={setTipJar} />
          </AppContext.Provider>
        </HashRouter>
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </MotionConfig>
  )
}
