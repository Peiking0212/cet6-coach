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
      new RegExp(`第\\s*${n}\\s*套`, 'i'),
      new RegExp(`\\(第${n}套\\)`, 'i'),
      new RegExp(`真题（第${n}套）`, 'i'),
      new RegExp(`听力音频.*第${n}套`, 'i'),
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
}

const LETTER_INDEX = { A: 0, B: 1, C: 2, D: 3 }

function parseArgs() {
  const args = process.argv.slice(2)
  let examId = '2024-06'
  let source = ''
  let label = ''
  let date = ''
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--exam-id' && args[i + 1]) examId = args[++i]
    else if (args[i] === '--source' && args[i + 1]) source = args[++i]
    else if (args[i] === '--label' && args[i + 1]) label = args[++i]
    else if (args[i] === '--date' && args[i + 1]) date = args[++i]
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
  }
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

async function readPdfText(filePath) {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) })
  const r = await parser.getText()
  return r.text.replace(/\r\n/g, '\n')
}

function findFile(dir, pattern) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      const hit = findFile(full, pattern)
      if (hit) return hit
    } else if (/\.downloading$/i.test(e.name)) {
      continue
    } else if (pattern.test(e.name)) {
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

function buildListeningItems(examId, setNum, questions, answers, audioUrl, hasListening) {
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
  const transcript =
    '本题为官方真题听力，无公开文字稿。请播放录音作答，完成后对照选项与答案解析。'
  const items = []
  for (const g of groups) {
    const qs = []
    for (let n = g.range[0]; n <= g.range[1]; n++) {
      const q = byNum.get(n)
      if (!q) continue
      const letter = answers.get(n)
      qs.push({
        id: `q${n}`,
        stem: `Question ${n}`,
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
      sentences: [],
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
    const passage = (passageMatch?.[1] ?? body)
      .replace(/--\s*\d+\s+of\s+\d+\s+--/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)
    const qRe = /(\d{2})\.\s*([\s\S]*?)(?=\n\s*\d{2}\.\s*|\n\s*Passage |$)/g
    const questions = []
    let m
    while ((m = qRe.exec(body))) {
      const num = Number(m[1])
      if (num < 46 || num > 55) continue
      const block = m[0]
      if (!/A\)/.test(block)) continue
      const stem = m[2]
        .split(/\n\s*A\)/)[0]
        .replace(/\s+/g, ' ')
        .trim()
      const options = extractMcqOptions(block)
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

function copyAudioFiles(examId, sourceDir, profile) {
  const audioOutDir = path.join(rootDir, `public/audio/exams/${examId}`)
  const manifest = []
  fs.mkdirSync(audioOutDir, { recursive: true })
  const mp3s = collectMp3s(sourceDir)
  for (let set = 1; set <= 3; set++) {
    const patterns = profile.mp3Patterns(set)
    const destName = `set-${set}.mp3`
    const dest = path.join(audioOutDir, destName)
    const hit = mp3s.find((f) => patterns.some((p) => p.test(path.basename(f))))
    if (hit) {
      fs.copyFileSync(hit, dest)
      manifest.push({
        set,
        file: `/audio/exams/${examId}/${destName}`,
        status: 'ok',
        source: hit,
      })
    } else {
      const partial = findFile(
        sourceDir,
        new RegExp(`第${set}套.*\\.baiduyun\\.p\\.downloading$`),
      )
      manifest.push({
        set,
        file: `/audio/exams/${examId}/${destName}`,
        status: partial ? 'downloading' : 'missing',
        source: partial ?? null,
      })
    }
  }
  return manifest
}

async function main() {
  const { examId, source, label, date, profile } = parseArgs()
  if (!fs.existsSync(source)) {
    console.error(`Source folder not found: ${source}`)
    process.exit(1)
  }

  console.log(`Importing ${examId} from:\n  ${source}`)

  const examPdfs = [1, 2, 3].map((n) => findFile(source, profile.examPdf(n)))
  const answerPdfs = [1, 2, 3].map((n) => findFile(source, profile.answerPdf(n)))

  const audioManifest = copyAudioFiles(examId, source, profile)
  const listening = []
  const reading = []
  const translation = []
  const writing = []
  const gaps = []

  for (let i = 0; i < 3; i++) {
    const setNum = i + 1
    const examPath = examPdfs[i]
    const ansPath = answerPdfs[i]
    if (!examPath || !ansPath) {
      gaps.push(`第${setNum}套：缺少 PDF`)
      continue
    }
    const examText = normalizeText(await readPdfText(examPath))
    const answerText = normalizeText(await readPdfText(ansPath))
    const audioEntry = audioManifest.find((a) => a.set === setNum)
    const audioUrl =
      audioEntry?.status === 'ok' ? audioEntry.file : undefined
    const noListening = /不再提供听力|听力试题与第二套/.test(examText)

    if (noListening && setNum === 3) {
      gaps.push('第3套：官方说明听力与第2套相同（选项顺序不同），请使用第2套录音。')
      const set2Audio = audioManifest.find((a) => a.set === 2 && a.status === 'ok')
      if (set2Audio) {
        const listenAnswers = parseListeningAnswers(
          normalizeText(await readPdfText(answerPdfs[1])),
        )
        gaps.push('第3套听力题目未单独导入（与第2套音频相同）。')
      }
    } else {
      const lq = parseListeningQuestions(examText)
      const la = parseListeningAnswers(answerText)
      listening.push(
        ...buildListeningItems(examId, setNum, lq, la, audioUrl ?? '', !noListening),
      )
      if (!audioUrl) gaps.push(`第${setNum}套：听力 MP3 未就绪（百度网盘下载中或缺失）`)
      if (lq.length < 20) gaps.push(`第${setNum}套：仅解析到 ${lq.length}/25 道听力选择题`)
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

    reading.push(...parseCarefulReading(examId, examText, answerText, setNum))
  }

  const bundle = {
    meta: { id: examId, label, date },
    audioManifest,
    gaps,
    listening,
    reading,
    translation,
    writing,
  }

  fs.mkdirSync(dataExamsDir, { recursive: true })
  const outPath = path.join(dataExamsDir, `${examId}.json`)
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
