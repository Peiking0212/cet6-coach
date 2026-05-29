import translationRaw from './translation.json'
import readingRaw from './reading.json'
import listeningRaw from './listening.json'
import writingRaw from './writing.json'
import vocabularyRaw from './vocabulary.json'
import vocabularyDisorderedRaw from './vocabulary-cet6-disordered.json'
import vocabularyHighfreqRaw from './vocabulary-highfreq.json'
import vocabularyPhrasesGiftRaw from './vocabulary-phrases-gift.json'
import vocabularyBbdcPhrasesRaw from './vocabulary-bbdc-phrases.json'
import type {
  ListeningItem,
  ReadingItem,
  TranslationItem,
  VocabWord,
  WritingItem,
} from './types'

export const translationBank = translationRaw as unknown as TranslationItem[]
export const readingBank = readingRaw as unknown as ReadingItem[]
export const listeningBank = listeningRaw as unknown as ListeningItem[]
export const writingBank = writingRaw as unknown as WritingItem[]
export const vocabularyBank = vocabularyRaw as unknown as VocabWord[]
export const vocabularyDisorderedBank = vocabularyDisorderedRaw as unknown as VocabWord[]
export const vocabularyHighfreqBank = vocabularyHighfreqRaw as unknown as VocabWord[]
export const vocabularyPhrasesGiftBank = vocabularyPhrasesGiftRaw as unknown as VocabWord[]
export const vocabularyBbdcPhrasesBank = vocabularyBbdcPhrasesRaw as unknown as VocabWord[]

export interface VocabSource {
  id: string
  label: string
  words: VocabWord[]
  subtitle?: string
}

export const VOCAB_SOURCES: VocabSource[] = [
  { id: 'curated', label: '精选词库', subtitle: '内置记忆技巧', words: vocabularyBank },
  { id: 'disordered', label: '六级乱序', subtitle: '词汇表 DOC', words: vocabularyDisorderedBank },
  { id: 'highfreq', label: '六级高频词汇', subtitle: '高频词 PDF', words: vocabularyHighfreqBank },
  { id: 'phrases-gift', label: '高频词组', subtitle: '词组 PDF', words: vocabularyPhrasesGiftBank },
  { id: 'bbdc', label: '百词斩词表', subtitle: '真题词组', words: vocabularyBbdcPhrasesBank },
]

const allVocabWords = VOCAB_SOURCES.flatMap((s) => s.words)

export function findWord(id: string): VocabWord | null {
  return allVocabWords.find((w) => w.id === id) ?? null
}

import { EXAM_SETS, getExamBundle } from './exams'

export { EXAM_SETS } from './exams'

export function findItem(id: string) {
  for (const set of EXAM_SETS) {
    const b = getExamBundle(set.id)
    if (!b) continue
    const hit =
      b.translation.find((i) => i.id === id) ||
      b.reading.find((i) => i.id === id) ||
      b.listening.find((i) => i.id === id) ||
      b.writing.find((i) => i.id === id)
    if (hit) return hit
  }
  return (
    translationBank.find((i) => i.id === id) ||
    readingBank.find((i) => i.id === id) ||
    listeningBank.find((i) => i.id === id) ||
    writingBank.find((i) => i.id === id) ||
    null
  )
}
