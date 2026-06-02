import type {
  ReadingCarefulItem,
  ReadingItem,
  ReadingParagraphItem,
  ReadingSevenFiveItem,
  ReadingWordBankItem,
} from '@/data/types'
import { cleanCarefulPassage, cleanMcqOption, cleanPdfArtifacts } from '@/lib/sanitizeExamText'

export function sanitizeCarefulItem(item: ReadingCarefulItem): ReadingCarefulItem {
  return {
    ...item,
    passage: cleanCarefulPassage(item.passage, item.questions),
    questions: item.questions.map((q) => ({
      ...q,
      stem: cleanPdfArtifacts(q.stem),
      options: q.options.map((o) => cleanMcqOption(o)),
    })),
  }
}

export function sanitizeParagraphItem(item: ReadingParagraphItem): ReadingParagraphItem {
  return {
    ...item,
    paragraphs: item.paragraphs.map((p) => ({
      ...p,
      text: cleanPdfArtifacts(p.text),
    })),
    statements: item.statements.map((s) => ({
      ...s,
      text: cleanPdfArtifacts(s.text),
    })),
  }
}

export function sanitizeWordBankItem(item: ReadingWordBankItem): ReadingWordBankItem {
  return {
    ...item,
    passage: cleanPdfArtifacts(item.passage),
  }
}

export function sanitizeSevenFiveItem(item: ReadingSevenFiveItem): ReadingSevenFiveItem {
  return {
    ...item,
    passage: cleanPdfArtifacts(item.passage),
    options: item.options.map((o) => cleanPdfArtifacts(o)),
  }
}

export function sanitizeReadingItem(item: ReadingItem): ReadingItem {
  switch (item.kind) {
    case 'careful':
      return sanitizeCarefulItem(item)
    case 'paragraph':
      return sanitizeParagraphItem(item)
    case 'word_bank':
      return sanitizeWordBankItem(item)
    case 'seven_five':
      return sanitizeSevenFiveItem(item)
    default:
      return {
        ...item,
        passage: cleanPdfArtifacts(item.passage),
      }
  }
}
