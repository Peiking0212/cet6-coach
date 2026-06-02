import type { TranslationItem, TranslationSentence } from '@/data/types'
import { cleanPdfArtifacts } from '@/lib/sanitizeExamText'

/** PDF footer / watermark line accidentally split as a Chinese sentence. */
export function isTranslationFooter(cn: string): boolean {
  const t = cn.trim()
  if (!t) return true
  if (t.length > 80 && !/英语六级真题|页共|新一文化/i.test(t)) return false
  return /英语六级真题|第\s*[^\s。]{1,4}\s*页\s*共|by\s*:\s*新一文化/i.test(t)
}

export function stripTranslationEnFooter(en: string): string {
  return en
    .split(/译\s*点\s*精\s*析/i)[0]
    .replace(/\s*❺\s*[♦•·]?\s*译\s*点\s*精\s*析[\s\S]*$/i, '')
    .replace(/\s*[•·♦❺]\s*1\s*\.\s*第[\s\S]*$/i, '')
    .replace(/\s*六\s*级\s*\d{4}年[\s\S]*$/i, '')
    .replace(/\s*--\s*\d+\s+of\s+\d+\s*--[\s\S]*$/gi, '')
    .replace(/\s*❺[\s\S]*$/u, '')
    .replace(/\s*[♦•·]\s*$/u, '')
    .trim()
}

export function splitEnglishSentences(en: string): string[] {
  return stripTranslationEnFooter(en)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function inferKeyWords(cn: string, en: string): TranslationSentence['keyWords'] {
  const hints = [...cn.matchAll(/[（(]([^）)]+)[）)]/g)].map((m) => m[1].replace(/\s/g, ''))
  const out: TranslationSentence['keyWords'] = []
  const lower = en.toLowerCase()
  for (const hint of hints) {
    if (hint.length < 3) continue
    const spaced = hint.replace(/([a-z])([A-Z])/g, '$1 $2')
    const candidates = [hint, spaced, spaced.toLowerCase()]
    for (const c of candidates) {
      const idx = lower.indexOf(c.toLowerCase())
      if (idx >= 0) {
        const word = en.slice(idx, idx + c.length)
        if (word.length >= 3) {
          out.push({ word, hint: hint.length <= 24 ? hint : undefined })
          break
        }
      }
    }
    if (out.length >= 3) break
  }
  if (out.length === 0) {
    const words = en.match(/\b[a-z]{5,}\b/gi) ?? []
    const pick = [...new Set(words.map((w) => w.toLowerCase()))]
      .filter((w) => !/^(which|their|there|these|those|would|could|should|about|with|from|have|been|will|that|this|when|where|while)$/.test(w))
      .slice(0, 2)
    for (const w of pick) {
      const m = en.match(new RegExp(`\\b${w}\\b`, 'i'))
      if (m) out.push({ word: m[0] })
    }
  }
  return out.slice(0, 3)
}

function alignSentenceEnglish(
  sentences: TranslationSentence[],
  fullEn: string,
): TranslationSentence[] {
  const enParts = splitEnglishSentences(fullEn)
  if (enParts.length === sentences.length) {
    return sentences.map((s, i) => ({
      ...s,
      en: enParts[i],
      keyWords: s.keyWords.length ? s.keyWords : inferKeyWords(s.cn, enParts[i]),
    }))
  }
  return sentences.map((s) => ({
    ...s,
    en: s.en.trim() || fullEn,
    keyWords: s.keyWords.length ? s.keyWords : inferKeyWords(s.cn, fullEn),
  }))
}

/** Clean footers and align per-sentence reference English for UI + import. */
export function prepareTranslationItem(item: TranslationItem): TranslationItem {
  const cn = cleanPdfArtifacts(item.cn.replace(/\s+/g, ''))
  const en = stripTranslationEnFooter(
    cleanPdfArtifacts(item.en.replace(/\s+/g, ' ').trim()),
  )
  let sentences = item.sentences
    .map((s) => ({
      ...s,
      cn: cleanPdfArtifacts(s.cn.replace(/\s+/g, '')),
      en: cleanPdfArtifacts(s.en.replace(/\s+/g, ' ').trim()),
    }))
    .filter((s) => s.cn && !isTranslationFooter(s.cn))

  if (en) {
    sentences = alignSentenceEnglish(sentences, en)
  }

  return {
    ...item,
    cn,
    en,
    sentences,
    notes:
      en && item.notes?.includes('需对照')
        ? '参考译文来自官方解析。'
        : item.notes,
  }
}
