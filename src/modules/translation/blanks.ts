import type { TranslationSentence } from '@/data/types'

export type Part =
  | { type: 'text'; value: string }
  | { type: 'blank'; index: number; answer: string; hint?: string }

export function buildBlanks(sentence: TranslationSentence): Part[] {
  const parts: Part[] = []
  let rest = sentence.en
  let lower = rest.toLowerCase()
  let blankIndex = 0
  for (const kw of sentence.keyWords) {
    const pos = lower.indexOf(kw.word.toLowerCase())
    if (pos < 0) continue
    if (pos > 0) parts.push({ type: 'text', value: rest.slice(0, pos) })
    parts.push({ type: 'blank', index: blankIndex++, answer: kw.word, hint: kw.hint })
    rest = rest.slice(pos + kw.word.length)
    lower = rest.toLowerCase()
  }
  if (rest) parts.push({ type: 'text', value: rest })
  return parts
}

export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?'"]/g, '')
    .replace(/\s+/g, ' ')
}

export function blankCount(sentence: TranslationSentence): number {
  return buildBlanks(sentence).filter((p) => p.type === 'blank').length
}

/** crude keyword coverage for self-graded sentence translation */
export function keywordCoverage(answer: string, sentence: TranslationSentence): number {
  if (sentence.keyWords.length === 0) return 1
  const norm = normalize(answer)
  let hit = 0
  for (const kw of sentence.keyWords) {
    if (norm.includes(normalize(kw.word))) hit++
  }
  return hit / sentence.keyWords.length
}
