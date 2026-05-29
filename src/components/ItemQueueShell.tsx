import type { ReactNode } from 'react'
import { PracticeAllProgress } from '@/components/PracticeAllBanner'
import type { BatchContext } from '@/engine/practiceAll'
import { batchExitLabel } from '@/engine/practiceAll'

export function ItemQueueShell({
  batch,
  moduleLabel,
  children,
}: {
  batch?: BatchContext
  moduleLabel: string
  children: ReactNode
}) {
  return (
    <>
      {batch && batch.total > 1 && (
        <PracticeAllProgress index={batch.index} total={batch.total} moduleLabel={moduleLabel} />
      )}
      {children}
    </>
  )
}

export function queueExitLabel(batch?: BatchContext): string {
  return batchExitLabel(batch)
}
