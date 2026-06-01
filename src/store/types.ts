import type { ModuleType } from '@/data/types'
import type { WrongItem } from '@/engine/types'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface AiConfig {
  baseURL: string
  apiKey: string
  model: string
  /** route requests through local proxy at this origin when set */
  proxyURL: string
  temperature: number
}

export interface ModuleStat {
  attempts: number
  correct: number
  total: number
  totalTimeMs: number
  /** epoch ms of last practice */
  lastAt: number
}

export interface ReviewCard {
  wrong: WrongItem
  /** epoch ms when due */
  due: number
  /** repetition count (index into interval table) */
  reps: number
  addedAt: number
}

export interface DailyState {
  date: string // YYYY-MM-DD
  count: number
  goal: number
}

export interface LevelProgress {
  /** completed sub-levels: stars per level key (0-3) */
  stars: Record<string, number>
}

export interface VocabMastery {
  /** familiarity 0 (生词) - 5 (已掌握) */
  familiarity: number
  /** SRS interval index (into SRS_INTERVALS_MS) */
  reps: number
  /** epoch ms when this word is next due for review */
  due: number
  /** times the word has been studied/tested */
  seen: number
  /** times answered correctly */
  correct: number
  /** epoch ms when the word was first studied (used for 今日新词 counting) */
  firstAt: number
  /** epoch ms of last study */
  lastAt: number
}

/** grading buckets for the 背词 study flow */
export type VocabGrade = 'know' | 'fuzzy' | 'unknown'

/** placement tier assigned after onboarding test */
export type PlacementLevel = 'weak' | 'borderline' | 'pass' | 'high'

export const PLACEMENT_LABELS: Record<PlacementLevel, string> = {
  weak: '基础薄弱',
  borderline: '四级边缘',
  pass: '六级过线',
  high: '六级高分',
}

export interface StreakState {
  count: number
  longest: number
  /** YYYY-MM-DD of last practice day */
  lastDate: string
}

export interface MakeupState {
  /** week bucket when 补签卡 was last used */
  weekKey: string
  used: boolean
}

export interface CoachCache {
  date: string
  text: string
}

export interface StoreState {
  version: number
  points: number
  combo: number
  bestCombo: number
  theme: ThemeMode
  stats: Record<ModuleType, ModuleStat>
  review: ReviewCard[]
  daily: DailyState
  progress: Record<ModuleType, LevelProgress>
  ai: AiConfig
  /** total questions answered ever */
  answered: number
  /** per-word familiarity, keyed by VocabWord.id */
  vocab: Record<string, VocabMastery>
  placementDone: boolean
  placementLevel: PlacementLevel | null
  /** user dismissed optional home placement prompt */
  placementBannerDismissed: boolean
  /** per-module adaptive difficulty 1–5 */
  moduleDifficulty: Record<ModuleType, number>
  /** baseline difficulty from placement per module */
  placementBaseline: Record<ModuleType, number>
  streak: StreakState
  makeup: MakeupState
  coach: CoachCache
}
