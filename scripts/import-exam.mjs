/**
 * Import CET-6 exam materials from a local folder into src/data/exams/*.json
 * and copy listening MP3s to public/audio/exams/<exam-id>/
 *
 * Usage:
 *   node scripts/import-exam.mjs
 *   node scripts/import-exam.mjs --source "E:/path/to/2024年6月六级真题和答案"
 *
 * Personal study use only — do not commit large audio/PDF assets to git.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const dataExamsDir = path.join(rootDir, 'src/data/exams')

const EXAM_PROFILES = {
  '2024-06': {
    defaultSource: 'E:\\BaiduNetdiskDownload\\2024年6月六级真题和答案',
    label: '2024年6月六级真题',
    date: '2024-06',
    examPdf: (n) => new RegExp(`大学英语六级考试真题.*第${n}套.*\\.pdf$`),
    answerPdf: (n) => new RegExp(`真题答案速查.*第${n}套.*\\.pdf$`),
    mp3Patterns: (n) => [
      new RegExp(`听力音频.*第${n}套`, 'i'),
      new RegExp(`听力第${n}套`, 'i'),
      new RegExp(`第\\s*${n}\\s*套`, 'i'),
      new RegExp(`\\(第${n}套\\)`, 'i'),
      new RegExp(`真题（第${n}套）`, 'i'),
    ],
  },
  '2024-12': {
    defaultSource: 'E:\\BaiduNetdiskDownload\\2024年12月',
    label: '2024年12月六级真题',
    date: '2024-12',
    examPdf: (n) => new RegExp(`2024\\.12六级真题第${n}套.*\\.pdf$`),
    answerPdf: (n) => new RegExp(`2024\\.12英语六级解析第${n}套\\.pdf$`),
    mp3Patterns: (n) => [
      new RegExp(`2024年12月六级听力音频第${n}套`, 'i'),
      new RegExp(`第\\s*${n}\\s*套`, 'i'),
    ],
  },
  '2021-12': {
    defaultSource: 'E:\\BaiduNetdiskDownload\\2021年12月六级',
    label: '2021年12月六级真题',
    date: '2021-12',
    examPdf: (n) =>
      new RegExp(`(2021\\.12|2021年12月).*六级.*第${n}套.*\\.pdf$`, 'i'),
    answerPdf: (n) =>
      new RegExp(`(2021\\.12|2021年12月).*(答案|解析).*第${n}套.*\\.pdf$`, 'i'),
    mp3Patterns: (n) => [
      new RegExp(`2021年12月六级听力.*第${n}套`, 'i'),
      new RegExp(`2021\\.12.*第${n}套.*\\.mp3$`, 'i'),
      new RegExp(`第\\s*${n}\\s*套`, 'i'),
    ],
  },
  '2022-06': {
    defaultSource: 'E:\\BaiduNetdiskDownload\\2022年6月六级',
    label: '2022年6月六级真题',
    date: '2022-06',
    examPdf: (n) =>
      new RegExp(`(2022\\.06|2022年6月).*六级.*第${n}套.*\\.pdf$`, 'i'),
    answerPdf: (n) =>
      new RegExp(`(2022\\.06|2022年6月).*(答案|解析).*第${n}套.*\\.pdf$`, 'i'),
    mp3Patterns: (n) => [
      new RegExp(`2022年6月六级听力.*第${n}套`, 'i'),
      new RegExp(`2022\\.06.*第${n}套`, 'i'),
      new RegExp(`第\\s*${n}\\s*套`, 'i'),
    ],
  },
  '2022-12': {
    defaultSource: 'E:\\BaiduNetdiskDownload\\2022.12第1套',
    label: '2022年12月六级真题',
    date: '2022-12',
    examPdf: (n) => new RegExp(`2022\\.12六级真题第${n}套\\.pdf$`, 'i'),
    examPdfExclude: /答案|解析|详解|原文|听力|\.docx$/i,
    answerPdf: (n) => new RegExp(`2022\\.12六级真题第${n}套.*(答案|详解).*\\.pdf$`, 'i'),
    mp3Patterns: (n) => [
      new RegExp(`2022\\.12六级真题第${n}套听力`, 'i'),
      new RegExp(`2022年12月六级听力.*第${n}套`, 'i'),
      new RegExp(`第\\s*${n}\\s*套`, 'i'),
    ],
    listenTranscriptDocx: (n) =>
      new RegExp(`2022\\.12六级真题第${n}套听力原文\\.docx$`, 'i'),
  },
  '2022-09': {
    defaultSource: 'E:\\BaiduNetdiskDownload\\2022年09月CET6',
    label: '2022年9月六级真题',
    date: '2022-09',
    examPdf: (n) =>
      n === 1
        ? /2022年09月六级真题全3套\(1\)\.pdf$/i
        : new RegExp(`2022.*09.*第${n}套.*\\.pdf$`, 'i'),
    examPdfExclude: /解析|答案|详解/i,
    answerPdf: (n) =>
      n === 1 ? /2022\.09英语六级解析全3套\.pdf$/i : new RegExp(`2022.*09.*解析.*第${n}套`, 'i'),
    mp3Patterns: (n) => [
      new RegExp(`2022年9月六级听力`, 'i'),
      new RegExp(`第\\s*${n}\\s*套`, 'i'),
    ],
    sharedMp3Set: 1,
  },
  '2023-06': {
    defaultSource: 'E:\\BaiduNetdiskDownload\\2023.06第1套',
    label: '2023年6月六级真题',
    date: '2023-06',
    examPdf: (n) => new RegExp(`2023\\.06六级真题第${n}套\\.pdf$`, 'i'),
    examPdfExclude: /详解|答案|听力|音频/i,
    answerPdf: (n) => new RegExp(`2023\\.06六级真题第${n}套.*(详解|答案).*\\.pdf$`, 'i'),
    mp3Patterns: (n) => [
      new RegExp(`2023\\.06六级真题第${n}套.*听力`, 'i'),
      new RegExp(`2023年6月六级听力.*第${n}套`, 'i'),
      new RegExp(`第\\s*${n}\\s*套`, 'i'),
    ],
  },
  '2023-12': {
    defaultSource: 'E:\\BaiduNetdiskDownload\\2023年12月CET6',
    label: '2023年12月六级真题',
    date: '2023-12',
    examPdf: (n) => new RegExp(`2023\\.12六级真题第${n}套.*\\.pdf$`, 'i'),
    examPdfExclude: /解析|答案|听力|原文/i,
    answerPdf: (n) => new RegExp(`2023\\.12英语六级解析第${n}套\\.pdf$`, 'i'),
    mp3Patterns: (n) => [
      new RegExp(`2023年12月六级听力音频第${n}套`, 'i'),
      new RegExp(`第${n}套.*\\.mp3$`, 'i'),
    ],
  },
}

const LETTER_INDEX = { A: 0, B: 1, C: 2, D: 3 }

function parseArgs() {
  const args = process.argv.slice(2)
  let examId = '2024-06'
  let source = ''
  let label = ''
  let date = ''
  let sets = [1, 2, 3]
  let merge = false
  let audioOnly = false
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--exam-id' && args[i + 1]) examId = args[++i]
    else if (args[i] === '--source' && args[i + 1]) source = args[++i]
    else if (args[i] === '--label' && args[i + 1]) label = args[++i]
    else if (args[i] === '--date' && args[i + 1]) date = args[++i]
    else if (args[i] === '--sets' && args[i + 1]) {
      sets = args[++i].split(',').map((s) => Number(s.trim())).filter((n) => n >= 1 && n <= 3)
    } else if (args[i] === '--merge') merge = true
    else if (args[i] === '--audio-only') audioOnly = true
  }
  const profile = EXAM_PROFILES[examId]
  if (!profile) {
    console.error(`Unknown --exam-id: ${examId}. Known: ${Object.keys(EXAM_PROFILES).join(', ')}`)
    process.exit(1)
  }
  return {
    examId,
    source: source || profile.defaultSource,
    label: label || profile.label,
    date: date || profile.date,
    profile,
    sets: sets.length ? sets : [1, 2, 3],
    merge,
    audioOnly,
  }
}

function duplicateSet3FromSet2(audioManifest, audioOutDir) {
  const set2Audio = audioManifest.find((a) => a.set === 2 && a.status === 'ok')
  const set3Audio = audioManifest.find((a) => a.set === 3)
  if (set3Audio?.status === 'missing' && set2Audio) {
    const src = path.join(audioOutDir, 'set-2.mp3')
    const dest = path.join(audioOutDir, 'set-3.mp3')
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest)
      set3Audio.status = 'ok'
      set3Audio.source = `${set2Audio.source}（与第2套听力相同）`
    }
  }
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

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
  for (const q of questions) {
    const snippet = q.stem.slice(0, Math.min(50, q.stem.length)).trim()
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

async function readPdfText(filePath) {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) })
  const r = await parser.getText()
  return r.text.replace(/\r\n/g, '\n')
}

async function readDocxText(filePath) {
  const { value } = await mammoth.extractRawText({ path: filePath })
  return value.replace(/\r\n/g, '\n')
}

/** 扫描版 PDF 通常只有页码标记，几乎无正文 */
function isLikelyScanPdf(text) {
  const stripped = text.replace(/--\s*\d+\s+of\s+\d+\s+--/gi, '').trim()
  return stripped.length < 400 && !/Part\s*I\s*Writing/i.test(text)
}

const PAPER_MCQ_OPTIONS = [
  'A. 见试卷选项 A',
  'B. 见试卷选项 B',
  'C. 见试卷选项 C',
  'D. 见试卷选项 D',
]

/** 从听力原文 docx 提取题号与题干（选项在扫描试卷上） */
function parseListeningFromDocx(docxText) {
  const questions = []
  const re =
    /(?:\[?\d{2}:\d{2}(?:\.\d+)?\]?)?\s*(\d{1,2})\.\s+((?:What|Why|How|Which|Where|Who|According|To\s)[^<\n]+)/gi
  let m
  while ((m = re.exec(docxText))) {
    const num = Number(m[1])
    if (num < 1 || num > 25) continue
    const stem = m[2].replace(/\s+/g, ' ').trim()
    if (stem.length < 8) continue
    questions.push({
      number: num,
      stem,
      options: [...PAPER_MCQ_OPTIONS],
    })
  }
  const byNum = new Map()
  for (const q of questions) byNum.set(q.number, q)
  return [...byNum.values()].sort((a, b) => a.number - b.number)
}

function parseListeningSentencesFromDocx(docxText) {
  const lines = []
  const re = /(?:\[?\d{2}:\d{2}(?:\.\d+)?\]?)?\s*([MW]):\s*([^<\[]+)/gi
  let m
  while ((m = re.exec(docxText))) {
    const line = m[2].replace(/\s+/g, ' ').trim()
    if (line.length > 3) lines.push(`${m[1]}: ${line}`)
  }
  return lines
}

function hasAnalysisListening(text) {
  return (
    /Part\s*II[\s\S]*?Listening/i.test(text) &&
    (/听力原文/.test(text) || /听\s*力\s*原\s*文/.test(text))
  )
}

function englishListeningStem(raw) {
  return raw
    .replace(/[（(][^）)]*[）)]/g, ' ')
    .replace(/[\u4e00-\u9fff「」【】？?，。；：、\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractChineseMcqOptions(block) {
  const opts = []
  for (const L of ['A', 'B', 'C', 'D']) {
    const m = block.match(new RegExp(`${L}[）)]([^A-D）)\\n]+)`))
    if (!m) return null
    opts.push(cleanPdfArtifacts(m[1].replace(/\s+/g, ' ').trim()))
  }
  return opts.every((o) => o.length > 0) ? opts : null
}

function extractAnswerLetterFromChunk(chunk) {
  const m =
    chunk.match(/(?:故\s*)?([A-D])项与[^。\n]{0,80}相符/) ||
    chunk.match(/(?:答案|正确答案)[：:]\s*([A-D])/i)
  return m?.[1] ?? null
}

/**
 * 从「英语六级解析」PDF 提取听力原文、选择题与答案（常见于 2023.12 等详解册）。
 * @returns {{ sentences: string[], questions: { number, stem, options }[], answers: Map<number,string> }}
 */
function parseListeningFromAnalysisPdf(text) {
  const start = text.search(/Part\s*II[\s\S]*?Listening/i)
  const end = text.search(/Part\s*III[\s\S]*?Reading|Part\s*IV[\s\S]*?Translation/i)
  if (start < 0) {
    return { sentences: [], questions: [], answers: new Map() }
  }
  const section = text.slice(start, end > start ? end : start + 80000)

  const sentences = []
  const senRe = /(?:^|\n)([MW]):\s*([^\n]+)/g
  let sm
  while ((sm = senRe.exec(section))) {
    const line = sm[2].replace(/\s+/g, ' ').trim()
    if (line.length > 2) sentences.push(`${sm[1]}: ${line}`)
  }

  const answers = new Map()
  const questions = []
  const qRe =
    /(\d{1,2})\.\s*((?:What|Why|How|Which|Where|Who|According|To\s|Wat)[\s\S]*?)(?=\n\d{1,2}\.\s+(?:What|Why|How|Which|Where|Who|According|To\s|Wat)|$)/gi
  let m
  while ((m = qRe.exec(section))) {
    const num = Number(m[1])
    if (num < 1 || num > 25) continue
    const chunk = m[2]
    const stemRaw = chunk.split(/\n/)[0] ?? chunk
    const stem = englishListeningStem(stemRaw)
    if (stem.length < 8) continue
    const options = extractChineseMcqOptions(chunk)
    if (!options) continue
    const letter = extractAnswerLetterFromChunk(chunk)
    if (letter) answers.set(num, letter)
    questions.push({ number: num, stem, options })
  }

  const byNum = new Map()
  for (const q of questions) byNum.set(q.number, q)
  return {
    sentences,
    questions: [...byNum.values()].sort((a, b) => a.number - b.number),
    answers,
  }
}

function mergeListeningQuestions(primary, fromAnalysis) {
  const byNum = new Map(primary.map((q) => [q.number, { ...q }]))
  for (const aq of fromAnalysis) {
    const existing = byNum.get(aq.number)
    if (existing) {
      byNum.set(aq.number, {
        ...existing,
        stem: aq.stem || existing.stem,
        options:
          aq.options?.length === 4 && !/^见试卷选项/.test(aq.options[0])
            ? aq.options
            : existing.options,
      })
    } else {
      byNum.set(aq.number, aq)
    }
  }
  return [...byNum.values()].sort((a, b) => a.number - b.number)
}

/** 扫描卷仅有录音时：生成可播放的听力板块（题干见纸质卷） */
function buildListeningStubItems(examId, setNum, audioUrl) {
  const groups = [
    { id: 'conv1', kind: 'dialogue', title: '长对话 1', range: [1, 4] },
    { id: 'conv2', kind: 'dialogue', title: '长对话 2', range: [5, 8] },
    { id: 'pass1', kind: 'news', title: '听力篇章 1', range: [9, 11] },
    { id: 'pass2', kind: 'news', title: '听力篇章 2', range: [12, 15] },
    { id: 'lec1', kind: 'lecture', title: '讲座 1', range: [16, 18] },
    { id: 'lec2', kind: 'lecture', title: '讲座 2', range: [19, 21] },
    { id: 'lec3', kind: 'lecture', title: '讲座 3', range: [22, 25] },
  ]
  const transcript =
    '本套试卷 PDF 为扫描版，无法在应用内显示选项。请播放录音，在纸质试卷上作答，完成后对照详解 PDF。'
  return groups.map((g) => ({
    id: `${examId}-set${setNum}-listen-${g.id}`,
    module: 'listening',
    kind: g.kind,
    title: `第${setNum}套 · ${g.title}`,
    difficulty: 4,
    category: '真题',
    tags: ['真题', examId, `第${setNum}套`, '听力'],
    examSet: examId,
    examPaper: setNum,
    audioUrl,
    sentences: [],
    transcript,
    questions: Array.from({ length: g.range[1] - g.range[0] + 1 }, (_, i) => {
      const n = g.range[0] + i
      return {
        id: `q${n}`,
        stem: `Question ${n}（见纸质试卷）`,
        options: [...PAPER_MCQ_OPTIONS],
        answerIndex: 0,
        explanation: '请对照本套「答案及详解」PDF 或纸质卷核对。',
      }
    }),
  }))
}

function findFile(dir, pattern, exclude) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      const hit = findFile(full, pattern, exclude)
      if (hit) return hit
    } else if (/\.downloading$/i.test(e.name)) {
      continue
    } else if (pattern.test(e.name) && !(exclude && exclude.test(e.name))) {
      return full
    }
  }
  return null
}

function collectMp3s(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...collectMp3s(full))
    else if (e.name.endsWith('.mp3') && !/\.downloading$/i.test(e.name)) out.push(full)
  }
  return out
}

function normalizeText(t) {
  return t
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\uFF09/g, ')')
    .replace(/\uFF08/g, '(')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
}

/** @returns {Map<number, string>} */
function parseListeningAnswers(answerText) {
  const map = new Map()
  const block = answerText.match(
    /Listening Comprehension[\s\S]*?(?=Part\s*[ⅢI]{1,3}\s*Reading|$)/i,
  )
  if (!block) return map
  const letters = block[0].match(/\b([A-D])\b/g) ?? []
  for (let i = 0; i < Math.min(25, letters.length); i++) {
    map.set(i + 1, letters[i])
  }
  return map
}

function cleanOptionText(text) {
  return text
    .replace(/\s*Questions?\s+\d+\s+to\s+\d+[\s\S]*$/i, '')
    .replace(/\s*Questions?\s+\d+[\s\S]*$/i, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractMcqOptions(block) {
  const opts = { A: '', B: '', C: '', D: '' }
  const parts = block.split(/(?=\b[A-D]\)\s)/)
  for (const part of parts) {
    const m = part.match(/^([A-D])\)\s*([\s\S]*)/)
    if (!m) continue
    const letter = m[1]
    const text = cleanOptionText(m[2])
    opts[letter] = opts[letter] ? `${opts[letter]} ${text}` : text
  }
  return ['A', 'B', 'C', 'D'].map((L) => cleanOptionText(opts[L])).filter((t) => t.length > 0)
}

/** @returns {{ number: number, options: string[] }[]} */
function parseListeningQuestions(examText) {
  const start = examText.search(/Part\s*[IⅡ]{1,2}\s*Listening/i)
  const end = examText.search(/Part\s*[IⅢ]{1,3}\s*Reading/i)
  if (start < 0 || end < 0) return []
  const section = examText.slice(start, end)
  const questions = []
  const re =
    /(\d{1,2})\.\s*A\)\s*([\s\S]*?)(?=\n\s*\d{1,2}\.\s*A\)|Section [ABC]|Part\s*III|$)/g
  let m
  while ((m = re.exec(section))) {
    const num = Number(m[1])
    if (num < 1 || num > 25) continue
    const opts = extractMcqOptions(m[0])
    if (opts.length === 4) questions.push({ number: num, options: opts })
  }
  return questions.sort((a, b) => a.number - b.number)
}

function buildListeningItems(
  examId,
  setNum,
  questions,
  answers,
  audioUrl,
  hasListening,
  docxSentences = [],
) {
  if (!hasListening) return []
  const groups = [
    { id: 'conv1', kind: 'dialogue', title: '长对话 1', range: [1, 4] },
    { id: 'conv2', kind: 'dialogue', title: '长对话 2', range: [5, 8] },
    { id: 'pass1', kind: 'news', title: '听力篇章 1', range: [9, 11] },
    { id: 'pass2', kind: 'news', title: '听力篇章 2', range: [12, 15] },
    { id: 'lec1', kind: 'lecture', title: '讲座 1', range: [16, 18] },
    { id: 'lec2', kind: 'lecture', title: '讲座 2', range: [19, 21] },
    { id: 'lec3', kind: 'lecture', title: '讲座 3', range: [22, 25] },
  ]
  const byNum = new Map(questions.map((q) => [q.number, q]))
  const transcript = docxSentences.length
    ? docxSentences.join('\n')
    : '本题为官方真题听力，无公开文字稿。请播放录音作答，完成后对照选项与答案解析。'
  const items = []
  for (const g of groups) {
    const qs = []
    for (let n = g.range[0]; n <= g.range[1]; n++) {
      const q = byNum.get(n)
      if (!q) continue
      const letter = answers.get(n)
      qs.push({
        id: `q${n}`,
        stem: q.stem ?? `Question ${n}`,
        options: q.options,
        answerIndex: letter ? (LETTER_INDEX[letter] ?? 0) : 0,
        explanation: letter
          ? `官方答案：${letter}。`
          : '答案见速查册，导入时未匹配到题号。',
      })
    }
    if (!qs.length) continue
    items.push({
      id: `${examId}-set${setNum}-listen-${g.id}`,
      module: 'listening',
      kind: g.kind,
      title: `第${setNum}套 · ${g.title}`,
      difficulty: 4,
      category: '真题',
      tags: ['真题', examId, `第${setNum}套`, '听力'],
      examSet: examId,
      examPaper: setNum,
      audioUrl,
      sentences: docxSentences.length ? docxSentences : [],
      transcript,
      questions: qs,
    })
  }
  return items
}

function parseWriting(examText, answerText) {
  const promptMatch = examText.match(
    /Part\s*I\s*Writing[\s\S]*?sentence\s*"([^"]+)"[\s\S]*?at least\s*(\d+)\s*words\s*but\s*no\s*more\s*than\s*(\d+)/i,
  )
  const sampleMatch = answerText.match(
    /Part I Writing[\s\S]*?参考范文[：:]\s*([\s\S]*?)(?=Part\s*[ⅡI]{1,2}|$)/i,
  )
  if (!promptMatch) return null
  const prompt = `Write an essay that begins with: "${promptMatch[1].trim()}" (${promptMatch[2]}–${promptMatch[3]} words).`
  const sample = (sampleMatch?.[1] ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000)
  return { prompt, minWords: Number(promptMatch[2]), maxWords: Number(promptMatch[3]), sample }
}

function parseTranslation(examText, answerText) {
  const cnMatch = examText.match(
    /Part IV Translation[\s\S]*?Sheet 2\.\s*([\s\S]*?)(?=--\s*\d+\s+of|$)/i,
  )
  const enMatch = answerText.match(
    /Part\s*[IVⅣ]+\s*Translation[\s\S]*?参考译文[：:]\s*([\s\S]*?)(?=--|$)/i,
  )
  if (!cnMatch) return null
  const cn = cnMatch[1].replace(/\s+/g, '').trim()
  const en = (enMatch?.[1] ?? '').replace(/\s+/g, ' ').trim()
  const sentences = cn
    .split(/(?<=[。！？])/)
    .filter(Boolean)
    .map((s, i) => ({
      cn: s,
      en: '',
      keyWords: [],
    }))
  return { cn, en, sentences }
}

function parseReadingCloze(examText, answerText) {
  const p3 = examText.search(/Part\s*[IⅢ]{1,3}\s*Reading/i)
  const p4 = examText.search(/Part\s*[IVⅣ]+\s*Translation/i)
  if (p3 < 0 || p4 < 0) return null
  const chunk = examText.slice(p3, p4)
  const secA = chunk.indexOf('Section A')
  const secB = chunk.indexOf('Section B')
  if (secA < 0 || secB < 0) return null
  const secText = chunk.slice(secA, secB)
  const passageMatch = secText.match(
    /Directions:[\s\S]*?\n\n([\s\S]*?)(?=\n[A-O]\)\s)/i,
  )
  const bankMatches = [...secText.matchAll(/\n([A-O])\)\s*([^\n]+)/g)]
  if (!passageMatch || bankMatches.length < 10) return null
  let passage = passageMatch[1]
    .replace(/--\s*\d+\s+of\s+\d+\s+--/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  for (let i = 26; i <= 35; i++) {
    passage = passage.replace(new RegExp(`\\b${i}\\b`, 'g'), `(${i - 25})`)
  }
  const wordBank = bankMatches.slice(0, 15).map((m) => {
    const w = m[2].trim().split(/\s+/)
    const pos = w.length > 1 && /^[a-z]+\.$/i.test(w[w.length - 1]) ? w.pop() : ''
    return { word: w.join(' '), pos: pos || '' }
  })
  const ansBlock = answerText.match(
    /Reading Comprehension[\s\S]*?26\s+27[\s\S]*?(\n\s*\d+\s+\d+[\s\S]*?){0,3}/i,
  )
  const blankAnswers = []
  if (ansBlock) {
    const letters = ansBlock[0].match(/\b([A-O])\b/g) ?? []
    for (let i = 0; i < 10 && i < letters.length; i++) {
      const letter = letters[i]
      const idx = letter.charCodeAt(0) - 'A'.charCodeAt(0)
      blankAnswers.push({
        answer: idx,
        explanation: `选词填空第 ${26 + i} 题官方答案：${letter}（${wordBank[idx]?.word ?? '?'}）。`,
      })
    }
  }
  while (blankAnswers.length < 10) {
    blankAnswers.push({ answer: 0, explanation: '答案待核对' })
  }
  return { passage, wordBank, blanks: blankAnswers }
}

function parseSectionB(examId, examText, answerText, setNum) {
  const p3 = examText.search(/Part\s*[IⅢ]{1,3}\s*Reading/i)
  const p4 = examText.search(/Part\s*[IVⅣ]+\s*Translation/i)
  if (p3 < 0 || p4 < 0) return null
  const chunk = examText.slice(p3, p4)
  const secA = chunk.indexOf('Section A')
  const secB = chunk.indexOf('Section B')
  const secC = chunk.indexOf('Section C')
  if (secB < 0 || secC < 0) return null
  const secText = chunk.slice(secB, secC)

  const paraMatches = [...secText.matchAll(/\n([A-O])\)\s*([\s\S]*?)(?=\n[A-O]\)\s|\n\s*3[6-9]\.\s|\n\s*4[0-5]\.\s|$)/g)]
  const paragraphs = paraMatches
    .map((m) => ({
      label: m[1],
      text: cleanPdfArtifacts(
        m[2]
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      ),
    }))
    .filter((p) => p.text.length > 20)

  const stmtRe = /(\d{2})\.\s*([\s\S]*?)(?=\n\s*\d{2}\.\s|$)/g
  const statements = []
  let sm
  while ((sm = stmtRe.exec(secText))) {
    const num = Number(sm[1])
    if (num < 36 || num > 45) continue
    const text = cleanPdfArtifacts(sm[2].replace(/\s+/g, ' ').trim())
    if (text.length > 10) statements.push({ id: `s${num}`, text, num })
  }

  const ansBlock = answerText.match(/36\s+37[\s\S]*?44\s+45/i)
  const answerLetters = ansBlock ? (ansBlock[0].match(/\b([A-O])\b/g) ?? []) : []

  if (paragraphs.length < 5 || statements.length < 5) return null

  const stmts = statements.slice(0, 10).map((s, i) => {
    const letter = answerLetters[i] ?? 'A'
    return {
      id: s.id,
      text: s.text,
      answer: letter,
      explanation: `官方答案：段落 ${letter}。`,
    }
  })

  return {
    paragraphs,
    statements: stmts,
  }
}

function parseCarefulReading(examId, examText, answerText, setNum) {
  const p3 = examText.search(/Part\s*[IⅢ]{1,3}\s*Reading/i)
  const p4 = examText.search(/Part\s*[IVⅣ]+\s*Translation/i)
  const chunk = examText.slice(p3, p4)
  const secC = chunk.lastIndexOf('Section C')
  if (secC < 0) return []
  const sec = chunk.slice(secC)
  const items = []
  const passages = [...sec.matchAll(/Passage (One|Two)\s*([\s\S]*?)(?=Passage |$)/gi)]
  const answerBlock = answerText.match(/46\s+47[\s\S]*?52\s+53/gi)
  let answerLetters = []
  if (answerBlock) {
    answerLetters = answerBlock[0].match(/\b([A-D])\b/g) ?? []
  }
  let ai = 0
  for (let pi = 0; pi < passages.length; pi++) {
    const body = passages[pi][2]
    const passageMatch = body.match(
      /following passage\.\s*([\s\S]*?)(?=Questions \d+ to|$)/i,
    )
    const qRe = /(\d{2})\.\s*([\s\S]*?)(?=\n\s*\d{2}\.\s*|\n\s*Passage |$)/g
    const questions = []
    let m
    while ((m = qRe.exec(body))) {
      const num = Number(m[1])
      if (num < 46 || num > 55) continue
      const block = m[0]
      if (!/A\)/.test(block)) continue
      const stem = cleanPdfArtifacts(
        m[2]
          .split(/\n\s*A\)/)[0]
          .replace(/\s+/g, ' ')
          .trim(),
      )
      const options = extractMcqOptions(block).map((o) => cleanPdfArtifacts(o.replace(/^[A-D][.)]\s*/i, '')))
      if (options.length !== 4) continue
      const letter = answerLetters[ai++] ?? 'A'
      questions.push({
        id: `q${num}`,
        stem,
        options,
        answerIndex: LETTER_INDEX[letter] ?? 0,
        explanation: `官方答案：${letter}。`,
      })
    }
    const rawPassage = (passageMatch?.[1] ?? body)
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)
    const passage = cleanCarefulPassage(rawPassage, questions)
    if (passage && questions.length) {
      items.push({
        id: `${examId}-set${setNum}-read-careful-${pi + 1}`,
        module: 'reading',
        kind: 'careful',
        title: `第${setNum}套 · 仔细阅读 · 篇章${pi + 1}`,
        difficulty: 4,
        category: '真题',
        tags: ['真题', examId, `第${setNum}套`, '仔细阅读'],
        examSet: examId,
        examPaper: setNum,
        passage,
        questions,
      })
    }
  }
  return items
}

function copyAudioFiles(examId, sourceDir, profile, sets) {
  const audioOutDir = path.join(rootDir, `public/audio/exams/${examId}`)
  const manifest = []
  fs.mkdirSync(audioOutDir, { recursive: true })
  const mp3s = collectMp3s(sourceDir)
  const sharedHit = profile.sharedMp3Set
    ? mp3s.find((f) => profile.mp3Patterns(profile.sharedMp3Set).some((p) => p.test(path.basename(f))))
    : null
  for (const set of sets) {
    const patterns = profile.mp3Patterns(set)
    const destName = `set-${set}.mp3`
    const dest = path.join(audioOutDir, destName)
    let hit = mp3s.find((f) => {
      const base = path.basename(f)
      const rel = path.relative(sourceDir, f).replace(/\\/g, '/')
      return patterns.some((p) => p.test(base) || p.test(rel))
    })
    if (!hit && sharedHit && set === profile.sharedMp3Set) hit = sharedHit
    if (!hit && sharedHit && profile.sharedMp3Set) hit = sharedHit
    if (hit) {
      fs.copyFileSync(hit, dest)
      manifest.push({
        set,
        file: `/audio/exams/${examId}/${destName}`,
        status: 'ok',
        source: hit,
      })
    } else {
      manifest.push({
        set,
        file: `/audio/exams/${examId}/${destName}`,
        status: 'missing',
        source: null,
      })
    }
  }
  return manifest
}

function mergeBundles(existing, incoming) {
  if (!existing) return incoming
  const mergeList = (a, b) => {
    const out = [...a]
    for (const item of b) {
      const idx = out.findIndex((x) => x.id === item.id)
      if (idx >= 0) out[idx] = item
      else out.push(item)
    }
    return out
  }
  return {
    meta: incoming.meta,
    audioManifest: mergeList(existing.audioManifest ?? [], incoming.audioManifest ?? []),
    gaps: [...new Set([...(existing.gaps ?? []), ...(incoming.gaps ?? [])])],
    listening: mergeList(existing.listening ?? [], incoming.listening ?? []),
    reading: mergeList(existing.reading ?? [], incoming.reading ?? []),
    translation: mergeList(existing.translation ?? [], incoming.translation ?? []),
    writing: mergeList(existing.writing ?? [], incoming.writing ?? []),
  }
}

async function main() {
  const { examId, source, label, date, profile, sets, merge, audioOnly } = parseArgs()
  if (!fs.existsSync(source)) {
    console.error(`Source folder not found: ${source}`)
    process.exit(1)
  }

  console.log(`${audioOnly ? 'Copying audio' : 'Importing'} ${examId} from:\n  ${source}`)
  console.log(`Sets: ${sets.join(', ')}${merge ? ' (merge)' : ''}${audioOnly ? ' (audio only)' : ''}`)

  const audioManifest = copyAudioFiles(examId, source, profile, sets)
  const audioOutDir = path.join(rootDir, `public/audio/exams/${examId}`)
  duplicateSet3FromSet2(audioManifest, audioOutDir)

  if (audioOnly) {
    const outPath = path.join(dataExamsDir, `${examId}.json`)
    let bundle
    if (fs.existsSync(outPath)) {
      bundle = JSON.parse(fs.readFileSync(outPath, 'utf8'))
      bundle.audioManifest = audioManifest
    } else {
      bundle = {
        meta: { id: examId, label, date },
        audioManifest,
        gaps: [],
        listening: [],
        reading: [],
        translation: [],
        writing: [],
      }
    }
    fs.mkdirSync(dataExamsDir, { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2), 'utf8')
    console.log('Audio copy complete:', outPath)
    console.log('Audio:', audioManifest.map((a) => `${a.set}=${a.status}`).join(', '))
    const missing = audioManifest.filter((a) => a.status === 'missing')
    if (missing.length) {
      console.log('\nMissing MP3 for sets:', missing.map((a) => a.set).join(', '))
      process.exitCode = 1
    }
    return
  }

  const exclude = profile.examPdfExclude
  const examPdfs = Object.fromEntries(
    sets.map((n) => [n, findFile(source, profile.examPdf(n), exclude)]),
  )
  const answerPdfs = Object.fromEntries(
    sets.map((n) => [n, findFile(source, profile.answerPdf(n))]),
  )

  const listening = []
  const reading = []
  const translation = []
  const writing = []
  const gaps = []

  for (const setNum of sets) {
    const examPath = examPdfs[setNum]
    const ansPath = answerPdfs[setNum]
    const docxPath = profile.listenTranscriptDocx
      ? findFile(source, profile.listenTranscriptDocx(setNum))
      : null
    if (!examPath && !ansPath && !docxPath) {
      gaps.push(`第${setNum}套：缺少 PDF / docx`)
      continue
    }
    const examText = examPath ? normalizeText(await readPdfText(examPath)) : ''
    const answerText = ansPath ? normalizeText(await readPdfText(ansPath)) : ''
    const scanExam = examPath ? isLikelyScanPdf(examText) : false
    const scanAnswer = ansPath ? isLikelyScanPdf(answerText) : false
    const audioEntry = audioManifest.find((a) => a.set === setNum)
    const audioUrl =
      audioEntry?.status === 'ok' ? audioEntry.file : undefined
    const noListening = /不再提供听力|听力试题与第二套/.test(examText)

    if (scanExam) {
      gaps.push(
        `第${setNum}套：试卷 PDF 为扫描版，阅读/选词/写作/翻译请在纸质卷或详解 PDF 中完成`,
      )
    }
    if (scanAnswer && ansPath) {
      gaps.push(`第${setNum}套：答案 PDF 为扫描版，选择题答案需对照纸质详解`)
    }

    if (noListening && setNum === 3) {
      gaps.push('第3套：官方说明听力与第2套相同（选项顺序不同），请使用第2套录音。')
      gaps.push('第3套听力题目未单独导入（与第2套音频相同）。')
    } else if (docxPath) {
      const docxText = normalizeText(await readDocxText(docxPath))
      let lq = parseListeningFromDocx(docxText)
      let la = scanAnswer ? new Map() : parseListeningAnswers(answerText)
      let sentences = parseListeningSentencesFromDocx(docxText)
      if (hasAnalysisListening(answerText)) {
        const analysis = parseListeningFromAnalysisPdf(answerText)
        if (analysis.sentences.length > sentences.length) sentences = analysis.sentences
        lq = mergeListeningQuestions(lq, analysis.questions)
        for (const [n, letter] of analysis.answers) {
          if (!la.has(n)) la.set(n, letter)
        }
      }
      listening.push(
        ...buildListeningItems(examId, setNum, lq, la, audioUrl ?? '', true, sentences),
      )
      if (!audioUrl) gaps.push(`第${setNum}套：听力 MP3 未就绪`)
      if (lq.length < 20) {
        gaps.push(`第${setNum}套：从听力原文解析到 ${lq.length}/25 题`)
      }
    } else if (
      ansPath &&
      hasAnalysisListening(answerText) &&
      audioUrl &&
      !noListening
    ) {
      const analysis = parseListeningFromAnalysisPdf(answerText)
      listening.push(
        ...buildListeningItems(
          examId,
          setNum,
          analysis.questions,
          analysis.answers,
          audioUrl,
          true,
          analysis.sentences,
        ),
      )
      if (analysis.questions.length < 20) {
        gaps.push(`第${setNum}套：从解析 PDF 导入 ${analysis.questions.length}/25 道听力题`)
      }
      if (analysis.answers.size < 15) {
        gaps.push(`第${setNum}套：部分听力答案未能从解析 PDF 自动识别`)
      }
    } else if (scanExam && audioUrl) {
      listening.push(...buildListeningStubItems(examId, setNum, audioUrl))
      gaps.push(`第${setNum}套：已导入听力录音；题目与选项请用纸质试卷作答`)
    } else if (!scanExam) {
      const lq = parseListeningQuestions(examText)
      let la = parseListeningAnswers(answerText)
      if (audioUrl && lq.length < 5 && !noListening && hasAnalysisListening(answerText)) {
        const analysis = parseListeningFromAnalysisPdf(answerText)
        listening.push(
          ...buildListeningItems(
            examId,
            setNum,
            analysis.questions,
            analysis.answers,
            audioUrl,
            true,
            analysis.sentences,
          ),
        )
        if (analysis.questions.length < 20) {
          gaps.push(`第${setNum}套：从解析 PDF 导入 ${analysis.questions.length}/25 道听力题`)
        }
      } else if (audioUrl && lq.length < 5 && !noListening) {
        listening.push(...buildListeningStubItems(examId, setNum, audioUrl))
        gaps.push(`第${setNum}套：已导入听力录音；试卷未解析出听力题，请用纸质卷或详解作答`)
      } else {
        if (hasAnalysisListening(answerText) && la.size < 10) {
          const analysis = parseListeningFromAnalysisPdf(answerText)
          la = analysis.answers
        }
        listening.push(
          ...buildListeningItems(examId, setNum, lq, la, audioUrl ?? '', !noListening),
        )
        if (!audioUrl) gaps.push(`第${setNum}套：听力 MP3 未就绪（百度网盘下载中或缺失）`)
        if (lq.length < 20) gaps.push(`第${setNum}套：仅解析到 ${lq.length}/25 道听力选择题`)
      }
    } else if (audioUrl && !noListening) {
      listening.push(...buildListeningStubItems(examId, setNum, audioUrl))
      gaps.push(`第${setNum}套：已导入听力录音；阅读/听力题请用纸质卷`)
    }

    if (scanExam) {
      continue
    }

    const w = parseWriting(examText, answerText)
    if (w) {
      writing.push({
        id: `${examId}-set${setNum}-writing`,
        module: 'writing',
        title: `第${setNum}套 · 写作`,
        difficulty: 4,
        category: '真题',
        tags: ['真题', examId, `第${setNum}套`],
        examSet: examId,
        examPaper: setNum,
        prompt: w.prompt,
        minWords: w.minWords,
        maxWords: w.maxWords,
        rubric: [
          { name: '内容切题', weight: 30, desc: '扣题、观点明确' },
          { name: '结构连贯', weight: 25, desc: '段落清晰、逻辑衔接' },
          { name: '语言准确', weight: 30, desc: '语法拼写正确' },
          { name: '词汇句式', weight: 15, desc: '表达多样地道' },
        ],
        sample: w.sample || '（参考答案见速查 PDF）',
      })
    }

    const tr = parseTranslation(examText, answerText)
    if (tr) {
      translation.push({
        id: `${examId}-set${setNum}-translation`,
        module: 'translation',
        title: `第${setNum}套 · 翻译`,
        difficulty: 4,
        category: '真题',
        tags: ['真题', examId, `第${setNum}套`],
        examSet: examId,
        examPaper: setNum,
        cn: tr.cn,
        en: tr.en,
        sentences: tr.sentences,
        notes: tr.en ? '参考译文来自官方速查。' : '参考译文需对照速查 PDF。',
      })
    }

    const cloze = parseReadingCloze(examText, answerText)
    if (cloze) {
      reading.push({
        id: `${examId}-set${setNum}-read-cloze`,
        module: 'reading',
        kind: 'word_bank',
        title: `第${setNum}套 · 选词填空`,
        difficulty: 4,
        category: '真题',
        tags: ['真题', examId, `第${setNum}套`, '选词填空'],
        examSet: examId,
        examPaper: setNum,
        ...cloze,
      })
    }

    const sectionB = parseSectionB(examId, examText, answerText, setNum)
    if (sectionB) {
      reading.push({
        id: `${examId}-set${setNum}-read-paragraph`,
        module: 'reading',
        kind: 'paragraph',
        title: `第${setNum}套 · 长篇匹配`,
        difficulty: 4,
        category: '真题',
        tags: ['真题', examId, `第${setNum}套`, '长篇匹配'],
        examSet: examId,
        examPaper: setNum,
        ...sectionB,
      })
    } else {
      gaps.push(`第${setNum}套：Section B 长篇匹配未解析（可手动补 JSON）`)
    }

    reading.push(...parseCarefulReading(examId, examText, answerText, setNum))
  }

  const outPath = path.join(dataExamsDir, `${examId}.json`)
  let bundle = {
    meta: { id: examId, label, date },
    audioManifest,
    gaps,
    listening,
    reading,
    translation,
    writing,
  }

  if (merge && fs.existsSync(outPath)) {
    const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'))
    bundle = mergeBundles(existing, bundle)
  }

  fs.mkdirSync(dataExamsDir, { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2), 'utf8')

  console.log('Import complete:', outPath)
  console.log('Listening items:', listening.length, '| questions:', listening.reduce((s, i) => s + i.questions.length, 0))
  console.log('Reading items:', reading.length)
  console.log('Translation items:', translation.length)
  console.log('Writing items:', writing.length)
  console.log('Audio:', audioManifest.map((a) => `${a.set}=${a.status}`).join(', '))
  if (gaps.length) {
    console.log('\nManual gaps / notes:')
    gaps.forEach((g) => console.log(' -', g))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
