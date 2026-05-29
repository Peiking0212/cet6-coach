import type { ModuleType } from '@/data/types'

export interface WrongItem {
  /** stable unique key: `${module}:${refId}:${qid}` */
  key: string
  module: ModuleType
  refId: string
  refTitle: string
  question: string
  yourAnswer: string
  correctAnswer: string
  explanation?: string
}

export interface AttemptResult {
  module: ModuleType
  refId: string
  refTitle: string
  /** sub-level identifier, e.g. translation 'words' | 'sentence' | 'full' */
  level?: string
  correct: number
  total: number
  timeMs: number
  wrong: WrongItem[]
  /** writing/self-graded items may skip auto scoring */
  selfGraded?: boolean
}
