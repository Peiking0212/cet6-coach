import { MODULE_ORDER, type ModuleType, type VocabWord } from '@/data/types'
import type { StoreState } from './types'

export interface ModuleInsight {
  module: ModuleType
  accuracy: number
  avgTimeMs: number
  attempts: number
  /** higher = weaker = should practice more */
  weakness: number
}

const FAST_MS_PER_Q = 15_000
const SLOW_MS_PER_Q = 45_000

export function difficultyLabel(n: number): string {
  const clamped = Math.max(1, Math.min(5, Math.round(n)))
  const filled = '★'.repeat(clamped)
  const empty = '☆'.repeat(5 - clamped)
  return `难度 ${filled}${empty}`
}

export function moduleDifficulty(state: StoreState, module: ModuleType): number {
  return state.moduleDifficulty[module] ?? 3
}

export function bumpDifficulty(
  current: number,
  correct: boolean,
  avgMsPerQ: number,
): number {
  if (correct && avgMsPerQ <= FAST_MS_PER_Q) return Math.min(5, current + 1)
  if (!correct || avgMsPerQ >= SLOW_MS_PER_Q) return Math.max(1, current - 1)
  return current
}

export function applyAttemptDifficulty(
  state: StoreState,
  module: ModuleType,
  correct: number,
  total: number,
  timeMs: number,
): StoreState {
  if (total <= 0) return state
  const cur = moduleDifficulty(state, module)
  const avgMs = timeMs / total
  const mostlyCorrect = correct / total >= 0.6
  const next = bumpDifficulty(cur, mostlyCorrect, avgMs)
  if (next === cur) return state
  return {
    ...state,
    moduleDifficulty: { ...state.moduleDifficulty, [module]: next },
  }
}

/** sort so items near target difficulty appear first */
export function sortByTargetDifficulty<T extends { difficulty: number }>(
  items: T[],
  target: number,
): T[] {
  return [...items].sort(
    (a, b) => Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target),
  )
}

/** pick `count` items preferring those near target difficulty */
export function pickNearDifficulty<T extends { difficulty: number }>(
  items: T[],
  target: number,
  count: number,
): T[] {
  const sorted = sortByTargetDifficulty(items, target)
  const pool = sorted.length <= count ? sorted : sorted.slice(0, Math.max(count * 2, count + 4))
  const out: T[] = []
  const used = new Set<string>()
  for (const item of pool) {
    const key = 'id' in item ? String((item as { id: string }).id) : JSON.stringify(item)
    if (used.has(key)) continue
    used.add(key)
    out.push(item)
    if (out.length >= count) break
  }
  if (out.length < count) {
    for (const item of sorted) {
      const key = 'id' in item ? String((item as { id: string }).id) : JSON.stringify(item)
      if (used.has(key)) continue
      used.add(key)
      out.push(item)
      if (out.length >= count) break
    }
  }
  return out
}

/** synthetic 1–5 for vocab words without difficulty field */
export function vocabSyntheticDifficulty(word: VocabWord): number {
  const len = word.word.length
  if (len <= 5) return 2
  if (len <= 8) return 3
  if (len <= 11) return 4
  return 5
}

export function pickVocabNearDifficulty(
  words: VocabWord[],
  target: number,
  count: number,
): VocabWord[] {
  const tagged = words.map((w) => ({ w, d: vocabSyntheticDifficulty(w) }))
  const sorted = tagged.sort((a, b) => Math.abs(a.d - target) - Math.abs(b.d - target))
  return sorted.slice(0, count).map((t) => t.w)
}

export function moduleInsights(state: StoreState): ModuleInsight[] {
  return MODULE_ORDER.map((m) => {
    const s = state.stats[m]
    const accuracy = s.total > 0 ? s.correct / s.total : 0
    const avgTimeMs = s.total > 0 ? s.totalTimeMs / s.total : 0
    let weakness: number
    if (s.attempts === 0) {
      const baseline = state.placementBaseline[m] ?? 3
      weakness = 0.75 + (5 - baseline) * 0.05
    } else {
      const recency = Math.min(1, (Date.now() - s.lastAt) / (3 * 24 * 3600 * 1000))
      weakness = (1 - accuracy) * 0.8 + recency * 0.2
    }
    return { module: m, accuracy, avgTimeMs, attempts: s.attempts, weakness }
  })
}

export function recommendedModule(state: StoreState): ModuleInsight {
  const insights = moduleInsights(state)
  return [...insights].sort((a, b) => b.weakness - a.weakness)[0]
}
