import exam202209 from './2022-09.json'
import exam202112 from './2021-12.json'
import exam202206 from './2022-06.json'
import exam202212 from './2022-12.json'
import exam202306 from './2023-06.json'
import exam202312 from './2023-12.json'
import exam202406 from './2024-06.json'
import exam202412 from './2024-12.json'
import type {
  ExamSetFilter,
  ExamSetMeta,
  ListeningItem,
  ReadingItem,
  TranslationItem,
  WritingItem,
} from '../types'

export interface ExamBundle {
  meta: ExamSetMeta
  listening: ListeningItem[]
  reading: ReadingItem[]
  translation: TranslationItem[]
  writing: WritingItem[]
  gaps?: string[]
  audioManifest?: { set: number; file: string; status: string }[]
}

const BUNDLES: Record<string, ExamBundle> = {
  '2021-12': exam202112 as unknown as ExamBundle,
  '2022-06': exam202206 as unknown as ExamBundle,
  '2022-09': exam202209 as unknown as ExamBundle,
  '2022-12': exam202212 as unknown as ExamBundle,
  '2023-06': exam202306 as unknown as ExamBundle,
  '2023-12': exam202312 as unknown as ExamBundle,
  '2024-06': exam202406 as unknown as ExamBundle,
  '2024-12': exam202412 as unknown as ExamBundle,
}

export const EXAM_SETS: ExamSetMeta[] = Object.values(BUNDLES).map((b) => b.meta)

export function getExamBundle(id: string): ExamBundle | null {
  return BUNDLES[id] ?? null
}

function allExamListening(): ListeningItem[] {
  return EXAM_SETS.flatMap((s) => getExamBundle(s.id)?.listening ?? [])
}

function allExamReading(): ReadingItem[] {
  return EXAM_SETS.flatMap((s) => getExamBundle(s.id)?.reading ?? [])
}

function allExamTranslation(): TranslationItem[] {
  return EXAM_SETS.flatMap((s) => getExamBundle(s.id)?.translation ?? [])
}

function allExamWriting(): WritingItem[] {
  return EXAM_SETS.flatMap((s) => getExamBundle(s.id)?.writing ?? [])
}

export function filterListening(
  builtin: ListeningItem[],
  filter: ExamSetFilter,
): ListeningItem[] {
  if (filter === 'builtin') return builtin
  const exam =
    filter === 'all' ? allExamListening() : (getExamBundle(filter)?.listening ?? [])
  return filter === 'all' ? [...exam, ...builtin] : exam
}

export function filterReading(builtin: ReadingItem[], filter: ExamSetFilter): ReadingItem[] {
  if (filter === 'builtin') return builtin
  const exam = filter === 'all' ? allExamReading() : (getExamBundle(filter)?.reading ?? [])
  return filter === 'all' ? [...exam, ...builtin] : exam
}

export function filterTranslation(
  builtin: TranslationItem[],
  filter: ExamSetFilter,
): TranslationItem[] {
  if (filter === 'builtin') return builtin
  const exam =
    filter === 'all' ? allExamTranslation() : (getExamBundle(filter)?.translation ?? [])
  return filter === 'all' ? [...exam, ...builtin] : exam
}

export function filterWriting(builtin: WritingItem[], filter: ExamSetFilter): WritingItem[] {
  if (filter === 'builtin') return builtin
  const exam = filter === 'all' ? allExamWriting() : (getExamBundle(filter)?.writing ?? [])
  return filter === 'all' ? [...exam, ...builtin] : exam
}
