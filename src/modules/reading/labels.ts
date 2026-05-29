import type { ReadingKind } from '@/data/types'

export const READING_KIND_LABELS: Record<ReadingKind, string> = {
  word_bank: '选词填空（十五选十）',
  paragraph: '长篇阅读（段落匹配）',
  careful: '仔细阅读',
  mcq_cloze: '完形填空（四选一）',
  seven_five: '七选五',
}

export const READING_KIND_SHORT: Record<ReadingKind, string> = {
  word_bank: '选词',
  paragraph: '匹配',
  careful: '仔细',
  mcq_cloze: '完形',
  seven_five: '七选五',
}

export const READING_KIND_ORDER: ReadingKind[] = [
  'word_bank',
  'paragraph',
  'careful',
  'mcq_cloze',
  'seven_five',
]
