import { createContext, useContext, useState, type ReactNode } from 'react'
import { PlacementFlow } from './PlacementFlow'

const PlacementContext = createContext<{ openPlacement: () => void } | null>(null)

export function usePlacement() {
  const ctx = useContext(PlacementContext)
  if (!ctx) throw new Error('usePlacement must be used within PlacementProvider')
  return ctx
}

export function PlacementProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)

  return (
    <PlacementContext.Provider value={{ openPlacement: () => setActive(true) }}>
      {active && <PlacementFlow onDone={() => setActive(false)} />}
      {children}
    </PlacementContext.Provider>
  )
}
