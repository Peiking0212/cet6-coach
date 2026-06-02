import type { ModuleType } from '@/data/types'
import { flattenDayTasks, type SprintDay, type SprintTask } from '@/sprint/types'
import type { SprintItemRef } from '@/sprint/types'

function mergeRefs(refs: SprintItemRef[]): SprintItemRef[] {
  const byModule = new Map<ModuleType, string[]>()
  for (const r of refs) {
    const list = byModule.get(r.module) ?? []
    for (const id of r.ids) {
      if (!list.includes(id)) list.push(id)
    }
    byModule.set(r.module, list)
  }
  return [...byModule.entries()].map(([module, ids]) => ({ module, ids }))
}

function taskById(day: SprintDay, id: string): SprintTask | undefined {
  return flattenDayTasks(day).find((t) => t.id === id)
}

/** Link checklist / review steps to the practice items just completed in this day. */
export function resolveReviewRefs(day: SprintDay, task: SprintTask): SprintItemRef[] {
  if (task.itemRefs?.ids.length) return [task.itemRefs]

  const flat = flattenDayTasks(day)
  const id = task.id
  const refs: SprintItemRef[] = []

  const push = (taskId: string) => {
    const t = taskById(day, taskId)
    if (t?.itemRefs) refs.push(t.itemRefs)
  }

  if (/-listen-(review|words)$/.test(id)) {
    push(id.replace(/-listen-(review|words)$/, '-listen-do'))
  } else if (id === 'd8-review-listen') {
    push('d8-mock-listen')
  } else if (/-read-careful-review$/.test(id)) {
    push(id.replace(/-read-careful-review$/, '-read-careful-do'))
  } else if (/-read-para-review$/.test(id)) {
    push(id.replace(/-read-para-review$/, '-read-para-do'))
  } else if (/-read-err$/.test(id)) {
    const prefix = id.replace(/-read-err$/, '')
    for (const t of flat) {
      if (
        t.id.startsWith(prefix) &&
        t.itemRefs?.module === 'reading' &&
        (t.kind === 'practice' || t.kind === 'practice_queue')
      ) {
        refs.push(t.itemRefs)
      }
    }
  } else if (/-trans-(words|fix)$/.test(id)) {
    push(id.replace(/-trans-(words|fix)$/, '-trans-do'))
  } else if (id === 'd8-review-read') {
    push('d8-mock-read')
  } else if (id === 'd8-review-write') {
    push('d8-mock-trans')
    push('d8-mock-write')
  } else if (id === 'd10-check' || id === 'd11-check') {
    const prefix = id.replace(/-check$/, '')
    for (const t of flat) {
      if (
        t.id.startsWith(prefix) &&
        t.itemRefs &&
        (t.kind === 'practice' || t.kind === 'practice_queue')
      ) {
        refs.push(t.itemRefs)
      }
    }
  }

  return mergeRefs(refs)
}

export function isPlaceholderTranscript(text: string): boolean {
  return /无公开文字稿|无电子版|请播放录音/.test(text)
}
