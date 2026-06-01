import type { ModuleType } from '@/data/types'

export type SprintTaskKind =
  | 'checklist'
  | 'practice'
  | 'practice_queue'
  | 'template'
  | 'review'
  | 'mock'

export type EssayTemplateId = 'phenomenon' | 'opinion'

export interface SprintItemRef {
  module: ModuleType
  ids: string[]
}

export interface SprintTask {
  id: string
  label: string
  durationMin: number
  kind: SprintTaskKind
  itemRefs?: SprintItemRef
  templateId?: EssayTemplateId
  writingMode?: 'full' | 'intro' | 'body' | 'outline'
  tips?: string
  manualComplete?: boolean
  /** mock 总限时时长（分钟），覆盖 durationMin */
  mockDurationMin?: number
}

export interface SprintBlock {
  time: string
  title: string
  tasks: SprintTask[]
}

export interface SprintDay {
  day: number
  title: string
  goal: string
  summaryReminders: string[]
  blocks: SprintBlock[]
}

export interface FlatSprintTask extends SprintTask {
  blockTime: string
  blockTitle: string
  index: number
}

export function flattenDayTasks(day: SprintDay): FlatSprintTask[] {
  const out: FlatSprintTask[] = []
  let idx = 0
  for (const block of day.blocks) {
    for (const task of block.tasks) {
      out.push({
        ...task,
        blockTime: block.time,
        blockTitle: block.title,
        index: idx++,
      })
    }
  }
  return out
}
