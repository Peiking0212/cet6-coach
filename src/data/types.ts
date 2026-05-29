export type ModuleType =
  | 'listening'
  | 'translation'
  | 'reading'
  | 'writing'
  | 'vocabulary'

export const MODULE_LABELS: Record<ModuleType, string> = {
  listening: '听力',
  translation: '翻译',
  reading: '阅读',
  writing: '作文',
  vocabulary: '单词',
}

export const MODULE_ORDER: ModuleType[] = [
  'vocabulary',
  'listening',
  'translation',
  'reading',
  'writing',
]

export interface BaseItem {
  id: string
  module: ModuleType
  title: string
  /** 1 (easy) - 5 (hard) */
  difficulty: number
  tags: string[]
  /** category for adaptive grouping, e.g. 文化 / 经济 / 科技 */
  category?: string
  /** imported official exam bundle id, e.g. 2024-06 */
  examSet?: string
  /** paper number within the exam set (1–3) */
  examPaper?: number
}

export interface ExamSetMeta {
  id: string
  label: string
  date: string
}

export type ExamSetFilter = 'all' | 'builtin' | string

/* ---------------- Translation ---------------- */

export interface TranslationSentence {
  cn: string
  en: string
  /** key English words that become blanks in level 1 (重点词填空) */
  keyWords: { word: string; hint?: string }[]
}

export interface TranslationItem extends BaseItem {
  module: 'translation'
  /** full chinese source */
  cn: string
  /** full english reference translation */
  en: string
  sentences: TranslationSentence[]
  notes?: string
}

/* ---------------- Reading ---------------- */

export type ReadingKind =
  | 'word_bank'
  | 'paragraph'
  | 'careful'
  | 'mcq_cloze'
  | 'seven_five'

export interface ReadingChoiceQuestion {
  id: string
  stem: string
  options: string[]
  answerIndex: number
  explanation: string
}

export interface ReadingCarefulItem extends BaseItem {
  module: 'reading'
  kind: 'careful'
  passage: string
  questions: ReadingChoiceQuestion[]
}

export interface ReadingBankBlank {
  /** index into wordBank for the correct word */
  answer: number
  explanation: string
}

/** CET-6 Section A — 选词填空 / 十五选十 */
export interface ReadingWordBankItem extends BaseItem {
  module: 'reading'
  kind: 'word_bank'
  /** passage text where blanks are marked as (1)(2)... */
  passage: string
  wordBank: { word: string; pos: string }[]
  blanks: ReadingBankBlank[]
}

/** CET-6 Section B — 长篇阅读 / 段落信息匹配 */
export interface ReadingParagraphBlock {
  label: string
  text: string
}

export interface ReadingParagraphStatement {
  id: string
  text: string
  /** paragraph label, e.g. "C" */
  answer: string
  explanation: string
}

export interface ReadingParagraphItem extends BaseItem {
  module: 'reading'
  kind: 'paragraph'
  paragraphs: ReadingParagraphBlock[]
  statements: ReadingParagraphStatement[]
}

/** 完形填空 — each blank has four MCQ options */
export interface ReadingMcqBlank {
  options: string[]
  answerIndex: number
  explanation: string
}

export interface ReadingMcqClozeItem extends BaseItem {
  module: 'reading'
  kind: 'mcq_cloze'
  passage: string
  blanks: ReadingMcqBlank[]
}

/** 七选五 — five gaps, seven sentence options */
export interface ReadingSevenFiveBlank {
  /** index into options for the correct sentence */
  answer: number
  explanation: string
}

export interface ReadingSevenFiveItem extends BaseItem {
  module: 'reading'
  kind: 'seven_five'
  passage: string
  options: string[]
  blanks: ReadingSevenFiveBlank[]
}

export type ReadingItem =
  | ReadingCarefulItem
  | ReadingWordBankItem
  | ReadingParagraphItem
  | ReadingMcqClozeItem
  | ReadingSevenFiveItem

/** @deprecated use ReadingWordBankItem */
export type ReadingClozeItem = ReadingWordBankItem

/* ---------------- Listening ---------------- */

export interface ListeningQuestion {
  id: string
  stem: string
  options: string[]
  answerIndex: number
  explanation: string
}

export interface ListeningItem extends BaseItem {
  module: 'listening'
  kind: 'news' | 'dialogue' | 'lecture'
  /** spoken script, split into sentences for sentence-by-sentence playback */
  sentences: string[]
  /** full transcript shown after answering */
  transcript: string
  questions: ListeningQuestion[]
  /** reserved hook for importing real audio later */
  audioUrl?: string
}

/* ---------------- Writing ---------------- */

export interface WritingItem extends BaseItem {
  module: 'writing'
  prompt: string
  /** required word range */
  minWords: number
  maxWords: number
  rubric: { name: string; weight: number; desc: string }[]
  sample: string
  outline?: string[]
}

/* ---------------- Vocabulary ---------------- */

export interface VocabWord {
  id: string
  word: string
  /** IPA phonetic, e.g. /əˈbʌndənt/ */
  phonetic: string
  /** 词性: n. / v. / adj. / adv. ... */
  pos: string
  /** 释义 (Chinese meaning) */
  meaning: string
  /** example sentence in English */
  example: string
  /** Chinese translation of the example */
  exampleCn: string
  /**近义词 */
  synonyms?: string[]
  /** 词根词缀拆解，如 ab-离开 + -andon 给予 → 放弃 */
  root?: string
  /** 常用词组 / 搭配 */
  collocations?: string[]
  /** 记忆技巧：联想、谐音、场景等 */
  memoryTip?: string
  tags?: string[]
  /** reserved hook for importing real pronunciation audio later */
  audioUrl?: string
}

export type AnyItem =
  | TranslationItem
  | ReadingItem
  | ListeningItem
  | WritingItem
