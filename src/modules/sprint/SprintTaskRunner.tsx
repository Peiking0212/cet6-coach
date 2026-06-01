import { useMemo, useState } from 'react'
import type { ListeningItem, ReadingItem, TranslationItem, WritingItem } from '@/data/types'
import type { BatchContext } from '@/engine/practiceAll'
import { ListeningRunner } from '@/modules/listening/ListeningRunner'
import { CarefulRunner } from '@/modules/reading/CarefulRunner'
import { WordBankRunner } from '@/modules/reading/WordBankRunner'
import { ParagraphRunner } from '@/modules/reading/ParagraphRunner'
import { TranslationRunner } from '@/modules/translation/TranslationRunner'
import { WritingRunner } from '@/modules/writing/WritingRunner'
import { resolveItemRefs } from '@/sprint/resolveItems'
import type { SprintTask } from '@/sprint/types'
import { SprintTemplatePanel } from './SprintTemplatePanel'

type AnyItem = ListeningItem | ReadingItem | TranslationItem | WritingItem

function ReadingRunner({
  item,
  onExit,
  batch,
}: {
  item: ReadingItem
  onExit: () => void
  batch?: BatchContext
}) {
  if (item.kind === 'careful') return <CarefulRunner item={item} onExit={onExit} batch={batch} />
  if (item.kind === 'word_bank') return <WordBankRunner item={item} onExit={onExit} batch={batch} />
  if (item.kind === 'paragraph') return <ParagraphRunner item={item} onExit={onExit} batch={batch} />
  return null
}

function ItemRunner({
  item,
  onExit,
  batch,
  focusSection,
}: {
  item: AnyItem
  onExit: () => void
  batch?: BatchContext
  focusSection?: SprintTask['writingMode']
}) {
  if (item.module === 'listening') {
    return <ListeningRunner item={item} onExit={onExit} batch={batch} />
  }
  if (item.module === 'reading') {
    return <ReadingRunner item={item as ReadingItem} onExit={onExit} batch={batch} />
  }
  if (item.module === 'translation') {
    return <TranslationRunner item={item} onExit={onExit} batch={batch} />
  }
  if (item.module === 'writing') {
    return (
      <WritingRunner
        item={item}
        onExit={onExit}
        batch={batch}
        focusSection={focusSection}
        embedded
      />
    )
  }
  return null
}

export function SprintTaskRunner({
  task,
  onDone,
}: {
  task: SprintTask
  onDone: (stats?: { correct: number; total: number; timeMs: number }) => void
}) {
  const [queueIdx, setQueueIdx] = useState(0)
  const [showWriting, setShowWriting] = useState(false)

  const resolved = useMemo(() => {
    if (!task.itemRefs) return { items: [] as AnyItem[], missing: [] as string[] }
    return resolveItemRefs(task.itemRefs)
  }, [task.itemRefs])

  if (task.kind === 'template') {
    const writingItem = resolved.items.find((i) => i.module === 'writing') as WritingItem | undefined
    if (task.writingMode === 'outline' || !writingItem) {
      return (
        <div className="sprint-task-runner">
          {task.templateId && (
            <SprintTemplatePanel templateId={task.templateId} memorize={task.writingMode === 'outline'} />
          )}
          <button className="btn btn-primary runner-next" onClick={() => onDone()}>
            背完了，打卡
          </button>
        </div>
      )
    }
    if (!showWriting) {
      return (
        <div className="sprint-task-runner">
          {task.templateId && <SprintTemplatePanel templateId={task.templateId} />}
          <button className="btn btn-primary" onClick={() => setShowWriting(true)}>
            开始仿写
          </button>
        </div>
      )
    }
    return (
      <div className="sprint-task-runner">
        {task.templateId && <SprintTemplatePanel templateId={task.templateId} />}
        <WritingRunner
          item={writingItem}
          onExit={() => onDone({ correct: 1, total: 1, timeMs: 0 })}
          focusSection={task.writingMode}
          embedded
        />
      </div>
    )
  }

  const isPractice =
    task.kind === 'practice' || task.kind === 'practice_queue' || task.kind === 'mock'

  if (!isPractice) return null

  if (resolved.missing.length > 0) {
    return (
      <div className="sprint-missing card">
        <p>以下题目尚未导入，请先运行导入脚本：</p>
        <ul>
          {resolved.missing.map((id) => (
            <li key={id}>
              <code>{id}</code>
            </li>
          ))}
        </ul>
        <p className="sprint-missing-hint">
          <code>node scripts/import-exam.mjs --exam-id … --source &lt;路径&gt;</code>
        </p>
        <button className="btn btn-primary" onClick={() => onDone()}>
          已在纸质卷完成，打卡
        </button>
      </div>
    )
  }

  if (!resolved.items.length) return null

  const active = resolved.items[queueIdx]
  const batch: BatchContext | undefined =
    resolved.items.length > 1
      ? {
          index: queueIdx,
          total: resolved.items.length,
          onNext: () => setQueueIdx((i) => i + 1),
        }
      : undefined

  return (
    <div className="sprint-task-runner">
      <ItemRunner
        item={active}
        batch={batch}
        focusSection={task.writingMode}
        onExit={() => {
          if (queueIdx + 1 < resolved.items.length) {
            setQueueIdx(queueIdx + 1)
          } else {
            onDone()
          }
        }}
      />
    </div>
  )
}
