import type { ModuleType } from '@/data/types'
import {
  listeningBank,
  readingBank,
  translationBank,
  writingBank,
  VOCAB_SOURCES,
} from '@/data'

export interface BatchContext {
  index: number
  total: number
  onNext: () => void
}

export function isBatchActive(batch?: BatchContext): batch is BatchContext {
  return batch !== undefined && batch.index + 1 < batch.total
}

export function batchExitLabel(batch?: BatchContext): string {
  return isBatchActive(batch) ? '下一套 →' : '完成'
}

export function shuffleItems<T>(items: T[], shuffled: boolean): T[] {
  if (!shuffled) return [...items]
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface ModuleCountInfo {
  total: number
  detail: string
}

export function moduleCounts(): Record<ModuleType, ModuleCountInfo> {
  const listeningByKind = {
    news: listeningBank.filter((i) => i.kind === 'news').length,
    dialogue: listeningBank.filter((i) => i.kind === 'dialogue').length,
    lecture: listeningBank.filter((i) => i.kind === 'lecture').length,
  }
  const readingByKind = {
    word_bank: readingBank.filter((i) => i.kind === 'word_bank').length,
    paragraph: readingBank.filter((i) => i.kind === 'paragraph').length,
    careful: readingBank.filter((i) => i.kind === 'careful').length,
    mcq_cloze: readingBank.filter((i) => i.kind === 'mcq_cloze').length,
    seven_five: readingBank.filter((i) => i.kind === 'seven_five').length,
  }
  const vocabTotal = VOCAB_SOURCES.reduce((n, s) => n + s.words.length, 0)

  return {
    vocabulary: {
      total: vocabTotal,
      detail: `${VOCAB_SOURCES.length} 个词库 · ${vocabTotal} 条`,
    },
    listening: {
      total: listeningBank.length,
      detail: `新闻 ${listeningByKind.news} · 对话 ${listeningByKind.dialogue} · 讲座 ${listeningByKind.lecture}`,
    },
    reading: {
      total: readingBank.length,
      detail: `选词 ${readingByKind.word_bank} · 匹配 ${readingByKind.paragraph} · 仔细 ${readingByKind.careful} · 完形 ${readingByKind.mcq_cloze} · 七选五 ${readingByKind.seven_five}`,
    },
    translation: {
      total: translationBank.length,
      detail: `${translationBank.length} 篇汉译英`,
    },
    writing: {
      total: writingBank.length,
      detail: `${writingBank.length} 道作文题`,
    },
  }
}

export function practiceAllPath(module: ModuleType): string {
  return `/${module}?practiceAll=1`
}
