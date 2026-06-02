/**
 * Strip PDF page markers and embedded questions from imported exam JSON.
 * Run: node scripts/sanitize-exam-json.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const examsDir = path.join(__dirname, '../src/data/exams')

function cleanPdfArtifacts(text) {
  if (!text?.trim()) return text
  return text
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, ' ')
    .replace(
      /\d{4}\s*年\s*\d{1,2}\s*月\s*英语六级真题[\s\S]*?(?:--\s*\d+\s+of\s+\d+\s*--)?/gi,
      ' ',
    )
    .replace(/\d{4}(?:\s*\d)*\s*年(?:\s*\d)+\s*月\s*英语六级真题[\s\S]{0,100}?(?:页|共)/gi, ' ')
    .replace(/\d{4}\s*年\s*\d{1,2}\s*月英语六级真题第\d+[^.]*?(?:页|共)[^.]*/gi, ' ')
    .replace(/20(?:\s*\d){2}\s*年(?:\s*\d)+\s*月\s*英语六级真题/gi, ' ')
    .replace(/\d{4}年\d{1,2}月英语六级真题第\d+套第[^。]+页共[^。]+页/gi, ' ')
    .replace(/第\s*\d+\s*套\s*第\s*[^\s.]{1,4}\s*页\s*共\s*[^\s.]+\s*页/gi, ' ')
    .replace(/第\s*\d+\s*套\s*第\s*\d+\s*页\s*共\s*[^\s.]+\s*页/gi, ' ')
    .replace(/第\s*\d(?:\s*\d)*\s*套\s*第\s*\d(?:\s*\d)*\s*页\s*共\s*\d(?:\s*\d)*\s*页/gi, ' ')
    .replace(/\s+b\s*y\s*:\s*新一文化\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function cleanCarefulPassage(passage, questions) {
  let text = cleanPdfArtifacts(passage)
  for (const q of questions ?? []) {
    const snippet = (q.stem ?? '').slice(0, 50).trim()
    if (snippet.length < 12) continue
    const idx = text.indexOf(snippet)
    if (idx > 80) {
      text = text.slice(0, idx)
      break
    }
  }
  const m = text.match(
    /\s((?:4[6-9])|(?:5[0-5]))\.\s+(?:What|How|Why|Which|According|It\s|They\s|The\s|One\s|In\s)/i,
  )
  if (m?.index != null && m.index > 80) text = text.slice(0, m.index)
  text = text.replace(/\s((?:4[6-9])|(?:5[0-5]))\.\s*$/i, '')
  return text.trim()
}

function sanitizeReading(items) {
  if (!items?.length) return 0
  let n = 0
  for (const item of items) {
    if (item.kind === 'careful' && item.passage) {
      const before = item.passage
      item.passage = cleanCarefulPassage(item.passage, item.questions)
      if (item.questions) {
        for (const q of item.questions) {
          q.stem = cleanPdfArtifacts(q.stem)
          q.options = q.options?.map((o) => cleanPdfArtifacts(o.replace(/^[A-D][.)]\s*/i, '')))
        }
      }
      if (item.passage !== before) n += 1
    }
    if (item.kind === 'paragraph') {
      for (const p of item.paragraphs ?? []) p.text = cleanPdfArtifacts(p.text)
      for (const s of item.statements ?? []) s.text = cleanPdfArtifacts(s.text)
      n += 1
    }
    if (item.passage) item.passage = cleanPdfArtifacts(item.passage)
    if (item.options) item.options = item.options.map(cleanPdfArtifacts)
  }
  return n
}

function isTranslationFooter(cn) {
  const t = cn.trim()
  if (!t) return true
  if (t.length > 80 && !/英语六级真题|页共|新一文化/i.test(t)) return false
  return /英语六级真题|第\s*[^\s。]{1,4}\s*页\s*共|by\s*:\s*新一文化/i.test(t)
}

function splitEnglishSentences(en) {
  return en
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function cleanWritingSample(text) {
  if (!text?.trim()) return text
  return text
    .split(/Part\s*[ⅢI]{1,3}\s*Reading/i)[0]
    .split(/Part\s*[IVⅣ]+\s*Translation/i)[0]
    .replace(/\s+\d{2}(\s+\d{2}){3,}[\s\S]*$/i, '')
    .replace(/\s*--\s*\d+\s+of\s+\d+\s*--[\s\S]*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000)
}

function sanitizeWriting(items) {
  if (!items?.length) return 0
  let n = 0
  for (const item of items) {
    const before = item.sample
    if (item.sample) item.sample = cleanPdfArtifacts(cleanWritingSample(item.sample))
    if (item.prompt) item.prompt = cleanPdfArtifacts(item.prompt)
    if (item.sample !== before) n += 1
  }
  return n
}

function sanitizeTranslation(items) {
  if (!items?.length) return 0
  let n = 0
  for (const item of items) {
    const before = JSON.stringify(item)
    item.cn = cleanPdfArtifacts((item.cn ?? '').replace(/\s+/g, ''))
    item.en = cleanPdfArtifacts((item.en ?? '').replace(/\s+/g, ' ').trim())
    item.sentences = (item.sentences ?? [])
      .map((s) => ({
        ...s,
        cn: cleanPdfArtifacts((s.cn ?? '').replace(/\s+/g, '')),
        en: cleanPdfArtifacts((s.en ?? '').replace(/\s+/g, ' ').trim()),
      }))
      .filter((s) => s.cn && !isTranslationFooter(s.cn))
    item.en = (item.en ?? '')
      .split(/译\s*点\s*精\s*析/i)[0]
      .replace(/\s*❺\s*[♦•·]?\s*译\s*点\s*精\s*析[\s\S]*$/i, '')
      .replace(/\s*[•·♦❺]\s*1\s*\.\s*第[\s\S]*$/i, '')
      .replace(/\s*六\s*级\s*\d{4}年[\s\S]*$/i, '')
      .replace(/\s*❺[\s\S]*$/u, '')
      .replace(/\s*[♦•·]\s*$/u, '')
      .trim()
    const parts = item.en ? splitEnglishSentences(item.en) : []
    if (parts.length === item.sentences.length) {
      item.sentences = item.sentences.map((s, i) => ({
        ...s,
        en: parts[i],
      }))
    } else if (item.en) {
      item.sentences = item.sentences.map((s) => ({
        ...s,
        en: s.en || item.en,
      }))
    }
    if (item.en && item.notes?.includes('需对照')) {
      item.notes = '参考译文来自官方解析。'
    }
    if (JSON.stringify(item) !== before) n += 1
  }
  return n
}

function sanitizeListening(items) {
  if (!items?.length) return 0
  for (const item of items) {
    if (item.transcript) item.transcript = cleanPdfArtifacts(item.transcript)
    for (const q of item.questions ?? []) {
      q.stem = cleanPdfArtifacts(q.stem)
      q.options = q.options?.map((o) => cleanPdfArtifacts(o.replace(/^[A-D][.)]\s*/i, '')))
    }
  }
  return items.length
}

let total = 0
for (const name of fs.readdirSync(examsDir)) {
  if (!name.endsWith('.json') || name === 'index.ts') continue
  const file = path.join(examsDir, name)
  const bundle = JSON.parse(fs.readFileSync(file, 'utf8'))
  const n =
    sanitizeReading(bundle.reading) +
    sanitizeListening(bundle.listening) +
    sanitizeTranslation(bundle.translation) +
    sanitizeWriting(bundle.writing)
  if (n) {
    fs.writeFileSync(file, JSON.stringify(bundle, null, 2), 'utf8')
    console.log(`${name}: cleaned`)
    total += n
  }
}
console.log(total ? `Done. Rebuild app to refresh.` : 'No changes needed.')
