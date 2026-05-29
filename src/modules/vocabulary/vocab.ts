import type { VocabWord } from '@/data/types'
import type { WrongItem } from '@/engine/types'

export const DECK_SIZE = 10

export interface Deck {
  id: string
  label: string
  words: VocabWord[]
}

export function buildDecks(words: VocabWord[], sourceId = 'default'): Deck[] {
  const decks: Deck[] = []
  for (let i = 0; i < words.length; i += DECK_SIZE) {
    const chunk = words.slice(i, i + DECK_SIZE)
    const n = i / DECK_SIZE + 1
    decks.push({ id: `${sourceId}:deck-${n}`, label: `第 ${n} 组`, words: chunk })
  }
  return decks
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function wordWrong(w: VocabWord, your: string): WrongItem {
  return {
    // stable per-word key so the SRS queue never duplicates a word across modes
    key: `vocabulary:${w.id}`,
    module: 'vocabulary',
    refId: w.id,
    refTitle: w.word,
    question: `${w.word} ${w.phonetic} 的意思是？`,
    yourAnswer: your || '（未作答）',
    correctAnswer: `${w.pos} ${w.meaning}`,
    explanation: `例句：${w.example}\n${w.exampleCn}`,
  }
}

/** pick `count` meaning-distractors for a word from the pool */
export function distractorMeanings(word: VocabWord, pool: VocabWord[], count = 3): string[] {
  const others = shuffle(pool.filter((w) => w.id !== word.id))
  const seen = new Set<string>([word.meaning])
  const out: string[] = []
  for (const w of others) {
    if (out.length >= count) break
    if (!seen.has(w.meaning)) {
      seen.add(w.meaning)
      out.push(w.meaning)
    }
  }
  return out
}

/** pick `count` word-distractors (English) for the reverse direction */
export function distractorWords(word: VocabWord, pool: VocabWord[], count = 3): string[] {
  const others = shuffle(pool.filter((w) => w.id !== word.id))
  return others.slice(0, count).map((w) => w.word)
}

export const MASTERY_LABELS = ['生词', '眼熟', '初识', '熟悉', '掌握', '精通']

export function masteryLabel(familiarity: number): string {
  return MASTERY_LABELS[Math.max(0, Math.min(5, familiarity))]
}

export function normalizeSpelling(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}
