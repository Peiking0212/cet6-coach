import type { ModuleType } from '@/data/types'
import type { AiConfig, ModuleStat, PlacementLevel, SprintProgress, StoreState } from './types'

export const STORE_KEY = 'cet6-coach-store-v1'
export const STORE_VERSION = 4

export function todayStr(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const emptyStat = (): ModuleStat => ({
  attempts: 0,
  correct: 0,
  total: 0,
  totalTimeMs: 0,
  lastAt: 0,
})

const modules: ModuleType[] = [
  'listening',
  'translation',
  'reading',
  'writing',
  'vocabulary',
]

export const defaultAi: AiConfig = {
  baseURL: '',
  apiKey: '',
  model: '',
  proxyURL: '',
  temperature: 0.4,
}

const defaultModuleDifficulty = (): Record<ModuleType, number> => ({
  listening: 3,
  translation: 3,
  reading: 3,
  writing: 3,
  vocabulary: 3,
})

export function weekKey(d = new Date()): string {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  return todayStr(copy)
}

export function defaultSprintProgress(): SprintProgress {
  return {
    startedAt: null,
    unlockedDay: 1,
    currentTaskIndex: {},
    completedTasks: {},
    dayCompletedAt: {},
    dayNotes: {},
    dayStats: {},
  }
}

export function makeDefaultState(): StoreState {
  const stats = {} as Record<ModuleType, ModuleStat>
  const progress = {} as StoreState['progress']
  const moduleDifficulty = defaultModuleDifficulty()
  for (const m of modules) {
    stats[m] = emptyStat()
    progress[m] = { stars: {} }
  }
  return {
    version: STORE_VERSION,
    points: 0,
    combo: 0,
    bestCombo: 0,
    theme: 'system',
    stats,
    review: [],
    daily: { date: todayStr(), count: 0, goal: 20 },
    progress,
    ai: { ...defaultAi },
    answered: 0,
    vocab: {},
    placementDone: false,
    placementLevel: null,
    placementBannerDismissed: false,
    moduleDifficulty: { ...moduleDifficulty },
    placementBaseline: { ...moduleDifficulty },
    streak: { count: 0, longest: 0, lastDate: '' },
    makeup: { weekKey: weekKey(), used: false },
    coach: { date: '', text: '' },
    sprint: defaultSprintProgress(),
  }
}

export function placementLevelFromScore(ratio: number): PlacementLevel {
  if (ratio >= 0.85) return 'high'
  if (ratio >= 0.65) return 'pass'
  if (ratio >= 0.45) return 'borderline'
  return 'weak'
}

export function baselineFromPlacement(level: PlacementLevel): Record<ModuleType, number> {
  const map: Record<PlacementLevel, number> = {
    weak: 1,
    borderline: 2,
    pass: 3,
    high: 4,
  }
  const base = map[level]
  return {
    vocabulary: base,
    listening: Math.max(1, base - 1),
    translation: base,
    reading: base,
    writing: Math.min(5, base + 1),
  }
}

/** spaced-repetition intervals in milliseconds, indexed by reps */
export const SRS_INTERVALS_MS = [
  0,
  1 * 24 * 3600 * 1000,
  2 * 24 * 3600 * 1000,
  4 * 24 * 3600 * 1000,
  7 * 24 * 3600 * 1000,
  15 * 24 * 3600 * 1000,
]

/** short re-show delay (10 min) for words graded 「不认识」so they recur soon */
export const VOCAB_AGAIN_MS = 10 * 60 * 1000

/** default number of brand-new words to introduce per day */
export const VOCAB_NEW_PER_DAY = 12

export function levelFromPoints(points: number): { level: number; cur: number; need: number } {
  let level = 1
  let need = 100
  let acc = 0
  while (points >= acc + need) {
    acc += need
    level += 1
    need = Math.round(need * 1.35)
  }
  return { level, cur: points - acc, need }
}
