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
    .replace(/\d{4}\s*年\s*\d{1,2}\s*月英语六级真题第\d+[^.]*?(?:页|共)[^.]*/gi, ' ')
    .replace(/第\s*\d+\s*套\s*第\s*\d+\s*页\s*共\s*[^\s.]+\s*页/gi, ' ')
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
    sanitizeReading(bundle.reading) + sanitizeListening(bundle.listening)
  if (n) {
    fs.writeFileSync(file, JSON.stringify(bundle, null, 2), 'utf8')
    console.log(`${name}: cleaned`)
    total += n
  }
}
console.log(total ? `Done. Rebuild app to refresh.` : 'No changes needed.')
