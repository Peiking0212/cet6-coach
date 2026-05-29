import {
  listeningBank,
  readingBank,
  translationBank,
  vocabularyBank,
} from '@/data'
import type { ModuleType } from '@/data/types'
import { shuffle, distractorMeanings } from '@/modules/vocabulary/vocab'
import { pickNearDifficulty, pickVocabNearDifficulty } from '@/store/adaptive'

export interface PlacementQuestion {
  id: string
  module: ModuleType
  tag: string
  prompt: string
  sub?: string
  options: string[]
  answerIndex: number
  difficulty: number
  /** reading: full article text */
  passage?: string
  /** listening: real audio file if available */
  audioUrl?: string
  /** listening: sentence-by-sentence TTS script */
  sentences?: string[]
  /** listening: full transcript (shown after answer) */
  transcript?: string
}

function vocabQuestions(): PlacementQuestion[] {
  const spread = pickVocabNearDifficulty(vocabularyBank.slice(0, 150), 3, 4)
  return spread.map((w, i) => {
    const pool = vocabularyBank.slice(0, 80)
    const opts = shuffle([w.meaning, ...distractorMeanings(w, pool)])
    return {
      id: `place-v-${i}`,
      module: 'vocabulary' as const,
      tag: '词汇',
      prompt: w.word,
      sub: w.phonetic,
      options: opts,
      answerIndex: opts.indexOf(w.meaning),
      difficulty: w.word.length <= 6 ? 2 : 3,
    }
  })
}

function readingQuestions(): PlacementQuestion[] {
  const items = pickNearDifficulty(readingBank.filter((r) => r.kind === 'careful'), 3, 2)
  const out: PlacementQuestion[] = []
  for (const item of items) {
    const q = item.questions[0]
    if (!q) continue
    const opts = shuffle([...q.options])
    out.push({
      id: `place-r-${item.id}`,
      module: 'reading',
      tag: '阅读',
      prompt: q.stem,
      sub: item.title,
      passage: item.passage,
      options: opts,
      answerIndex: opts.indexOf(q.options[q.answerIndex]),
      difficulty: item.difficulty,
    })
  }
  return out
}

function listeningQuestions(): PlacementQuestion[] {
  const items = pickNearDifficulty(listeningBank, 3, 2)
  const out: PlacementQuestion[] = []
  for (const item of items) {
    const q = item.questions[0]
    if (!q) continue
    const opts = shuffle([...q.options])
    out.push({
      id: `place-l-${item.id}`,
      module: 'listening',
      tag: '听力',
      prompt: q.stem,
      sub: item.title,
      audioUrl: item.audioUrl,
      sentences: item.sentences,
      transcript: item.transcript,
      options: opts,
      answerIndex: opts.indexOf(q.options[q.answerIndex]),
      difficulty: item.difficulty,
    })
  }
  return out
}

function translationQuestions(): PlacementQuestion[] {
  const items = pickNearDifficulty(translationBank, 3, 2)
  return items.map((item, i) => {
    const kw = item.sentences[0]?.keyWords[0]
    const word = kw?.word ?? 'solar terms'
    const opts = shuffle([
      word,
      'digital economy',
      'cultural heritage',
      'artificial intelligence',
    ])
    return {
      id: `place-t-${i}`,
      module: 'translation' as const,
      tag: '翻译',
      prompt: `「${item.sentences[0]?.cn.slice(0, 36) ?? item.cn.slice(0, 36)}…」\n关键词英文是？`,
      sub: kw?.hint,
      options: opts,
      answerIndex: opts.indexOf(word),
      difficulty: item.difficulty,
    }
  })
}

export function buildPlacementQuestions(): PlacementQuestion[] {
  const all = [
    ...vocabQuestions(),
    ...readingQuestions(),
    ...listeningQuestions(),
    ...translationQuestions(),
  ]
  return shuffle(all).slice(0, 10)
}
