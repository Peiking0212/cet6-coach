import type { ReadingItem } from '@/data/types'
import type { BatchContext } from '@/engine/practiceAll'
import { ItemQueueShell, queueExitLabel } from '@/components/ItemQueueShell'
import { CarefulRunner } from './CarefulRunner'
import { WordBankRunner } from './WordBankRunner'
import { ParagraphRunner } from './ParagraphRunner'
import { McqClozeRunner } from './McqClozeRunner'
import { SevenChooseFiveRunner } from './SevenChooseFiveRunner'

export function ReadingRunner({
  item,
  onExit,
  batch,
}: {
  item: ReadingItem
  onExit: () => void
  batch?: BatchContext
}) {
  const runner = (() => {
    switch (item.kind) {
      case 'careful':
        return <CarefulRunner item={item} onExit={onExit} batch={batch} />
      case 'word_bank':
        return <WordBankRunner item={item} onExit={onExit} batch={batch} />
      case 'paragraph':
        return <ParagraphRunner item={item} onExit={onExit} batch={batch} />
      case 'mcq_cloze':
        return <McqClozeRunner item={item} onExit={onExit} batch={batch} />
      case 'seven_five':
        return <SevenChooseFiveRunner item={item} onExit={onExit} batch={batch} />
    }
  })()

  return (
    <ItemQueueShell batch={batch} moduleLabel="阅读">
      {runner}
    </ItemQueueShell>
  )
}

export { queueExitLabel }