import type { ModuleType } from '@/data/types'
import { findItem } from '@/data'
import type { SprintItemRef } from '@/sprint/types'

export type ResolvedItem = NonNullable<ReturnType<typeof findItem>>

export interface ResolveResult {
  items: ResolvedItem[]
  missing: string[]
}

export function resolveItemRefs(ref: SprintItemRef): ResolveResult {
  const items: ResolvedItem[] = []
  const missing: string[] = []
  for (const id of ref.ids) {
    const item = findItem(id)
    if (item) items.push(item)
    else missing.push(id)
  }
  return { items, missing }
}

export function moduleLabel(module: ModuleType): string {
  const map: Record<ModuleType, string> = {
    listening: '听力',
    reading: '阅读',
    translation: '翻译',
    writing: '作文',
    vocabulary: '单词',
  }
  return map[module]
}
