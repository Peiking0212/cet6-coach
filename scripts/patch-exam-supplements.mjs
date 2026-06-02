/**
 * Supplement exam JSON: reference translations, writing samples, listening answers from 解析 PDF.
 * Run: node scripts/patch-exam-supplements.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFParse } from 'pdf-parse'
import { parseAnalysisListeningAnswersFull } from './lib/listening-answers.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const examsDir = path.join(__dirname, '../src/data/exams')
const LETTER_INDEX = { A: 0, B: 1, C: 2, D: 3 }

const TRANSLATION_REFS = {
  '2024-12-1': {
    en: "The successful development of the BeiDou Satellite Navigation System is a major scientific and technological achievement that China has made since the reform and opening-up. Through relentless efforts, researchers overcame a series of technical challenges, and the BeiDou system eventually achieved global coverage and high-precision positioning, making China one of the few countries in the world that independently possesses a global satellite navigation system. The BeiDou system has been widely used in many areas, including transportation, disaster relief, weather forecasting, and public security. The system has now gained extensive international recognition and begun to provide high-quality services to a growing number of countries and regions.",
    notes: '参考译文为应用内参考译法（六级真题风格）。',
  },
  '2024-12-2': {
    en: "Yangshan Port, a vital component of the Shanghai Shipping Center, serves as China's first deep-water port and one of the world's largest deep-water ports. Over nearly two decades of development, Yangshan Port has achieved a high level of automation. The employment of digital technology and artificial intelligence has significantly reduced labor costs and carbon emissions. The independently developed intelligent management system allows for the remote monitoring of large equipment from outside the office. In spite of the seeming busyness, Yangshan Port operates around the clock without visible labor-intensive work on site. As Yangshan Port continues to evolve, it is set to make even greater contributions to the establishment of Shanghai as a global shipping hub.",
    notes: '参考译文来自课程解析（Alpass 一笑而过）。',
  },
  '2024-12-3': {
    en: "Roaming the cosmos has always been a dream of the Chinese nation. In 2003, the successful launch of the Shenzhou-5 spacecraft marked a historic moment as Yang Liwei became the first Chinese astronaut to venture into space. In 2008, the Shenzhou-7 mission was launched, and Zhai Zhigang made history as the first Chinese astronaut to perform a spacewalk. In recent years, China's space industry has entered a period of rapid innovation and development, with the steady progress of space infrastructure construction. The completion of the Chinese Space Station in 2022 has written a brilliant chapter in the history of the Chinese nation and made significant contributions to the progress of human civilization. In the future, China's steps in space exploration will become more stable and reach farther.",
    notes: '参考译文来自课程解析（Alpass 一笑而过）。',
  },
}

const WRITING_SAMPLES = {
  '2024-12-1': `To increase the likelihood of success, one should set realistic goals and work persistently towards them. I strongly agree with this opening sentence because success in the CET-6 exam, as in life, depends more on steady effort than on overnight ambition.

When I prepared for the exam last year, I first set a realistic target: raise my listening score by fifteen points in three months. Instead of promising myself to memorize five hundred words a day, I planned fifty new words and one mock test every week. Small goals were easier to keep, and each completed week gave me confidence to continue.

Persistent work also helped me overcome setbacks. When my first mock score dropped, I did not change my major or blame the test. I reviewed mistakes, adjusted my schedule, and kept practicing at the same time every morning. Progress came slowly but surely.

In conclusion, realistic goals prevent frustration, and persistence turns plans into results. Whether we are students or young professionals, this principle is one of the most reliable paths to success.`,
  '2024-12-2': `College provides a great opportunity for students to explore various possibilities and find the right path for themselves. I could not agree more with this statement. During my freshman year, I joined the debate club, volunteered at a rural school, and took electives in psychology and design, none of which was planned in advance. These experiences helped me discover what I truly enjoy and what I am good at.

Exploring different fields also teaches students how to learn. When we step out of our comfort zone, we must ask questions, seek advice, and reflect on failure. Such habits are more valuable than any single skill. In addition, universities offer libraries, laboratories, and mentors that make exploration affordable and safe.

Of course, exploration should be guided rather than random. Students need to set deadlines, consult teachers, and eventually focus on a major. In short, college is not only about earning a degree; it is about understanding oneself and preparing for a meaningful career.`,
  '2024-12-3': `Nowadays, more and more students have realized the importance of self-discipline in their personal growth. I strongly agree with this view. Without self-discipline, talent and opportunity alone cannot guarantee success.

Self-discipline helps students manage time effectively. When we follow a study plan instead of scrolling on phones, we finish assignments on time and sleep better. It also builds resilience. Preparing for the CET-6 exam, for example, requires daily vocabulary review and mock tests even when we feel tired.

Moreover, disciplined people earn trust from teachers and employers. They keep promises, meet deadlines, and stay calm under pressure. These qualities matter more than short-term grades.

Self-discipline does not mean being harsh on oneself. It means setting clear goals, monitoring progress, and adjusting habits. As we practice it, we become more confident and independent, which is the core of personal growth.`,
  '2023-12-3': `With their valuable skills and experience, elderly people can continue to make significant contributions to society. This opening sentence reflects a trend we should welcome rather than ignore. Many retirees today are healthier and more educated than previous generations, and they still have much to offer.

First, elderly professionals can mentor young workers and pass on practical knowledge that cannot be learned from textbooks. In schools, hospitals, and community centers, senior volunteers often provide patient guidance and emotional support. Second, their life experience helps them handle complex social issues calmly, which is especially useful in mediation, charity work, and family services.

Of course, society should remove barriers that prevent older adults from participating. Flexible working hours, accessible public transport, and anti-age discrimination policies are essential. In return, communities gain wisdom, stability, and continuity. Supporting elderly people's active role is not only fair but also beneficial to social development.`,
}

const ANALYSIS_PDF = {
  '2023-12': (n) =>
    path.join('E:\\BaiduNetdiskDownload\\2023年12月CET6', `2023.12英语六级解析第${n}套.pdf`),
  '2022-09': (n) =>
    n === 1
      ? path.join('E:\\BaiduNetdiskDownload\\2022年09月CET6', '2022.09英语六级解析全3套.pdf')
      : null,
  '2024-06': (n) => {
    const dir = 'E:\\BaiduNetdiskDownload\\2024年6月六级真题和答案'
    if (!fs.existsSync(dir)) return null
    const hit = fs
      .readdirSync(dir)
      .find((f) => new RegExp(`解析.*第${n}套`, 'i').test(f) && f.endsWith('.pdf'))
    return hit ? path.join(dir, hit) : null
  },
  '2024-12': (n) => {
    const base = 'E:\\BaiduNetdiskDownload\\2024年12月'
    const analysis = path.join(base, '02、答案解析', `2024.12英语六级解析第${n}套.pdf`)
    if (fs.existsSync(analysis)) return analysis
    const exam = path.join(
      base,
      '01、真题PDF版（推荐使用）',
      `2024.12六级真题第${n}套【可复制可检索】.pdf`,
    )
    return fs.existsSync(exam) ? exam : null
  },
}

function splitEn(en) {
  return en
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

async function readPdfText(filePath) {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) })
  return (await parser.getText()).text
}

function applyTranslation(item, ref) {
  item.en = ref.en
  item.notes = ref.notes
  const parts = splitEn(ref.en)
  if (parts.length === item.sentences.length) {
    item.sentences = item.sentences.map((s, i) => ({ ...s, en: parts[i] }))
  } else {
    item.sentences = item.sentences.map((s) => ({ ...s, en: ref.en }))
  }
}

function parseTranslationEnFromPdf(text) {
  const end =
    '(?=六级\\s*[\\d.]+|六级\\s*\\d{4}|--\\s*\\d+\\s+of|202\\d年\\s*\\d+\\s*月大学|Part\\s*I\\s*Writing|译\\s*点\\s*精析|$)'
  const patterns = [
    new RegExp(
      `Part\\s*[IVNⅣ@]+\\s*Translation[\\s\\S]*?参\\s*考\\s*译\\s*文\\s*[：:•·]?\\s*([\\s\\S]*?)${end}`,
      'i',
    ),
    new RegExp(`参\\s*考\\s*译\\s*文\\s*[•·]?\\s*([\\s\\S]*?)${end}`, 'i'),
    /Part\s*[IVⅣ]+\s*Translation[\s\S]*?参考译文[：:]\s*([\s\S]*?)(?=--|$)/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1] && m[1].trim().length > 60 && /[a-z]/i.test(m[1])) {
      return m[1]
        .replace(/\s+/g, ' ')
        .split(/译\s*点\s*精\s*析/i)[0]
        .replace(/\s*--\s*\d+\s+of\s+\d+\s*--/gi, ' ')
        .trim()
    }
  }
  return ''
}

function parseWritingSampleFromPdf(text) {
  const m = text.match(
    /Part\s*I\s*Writing[\s\S]*?参考范文[：:]\s*([\s\S]*?)(?=Part\s*[ⅡI2]|Part\s*III|$)/i,
  )
  if (!m?.[1]) return ''
  return m[1]
    .split(/Part\s*[ⅢI]{1,3}\s*Reading/i)[0]
    .split(/Part\s*[IVⅣ]+\s*Translation/i)[0]
    .replace(/\s+\d{2}(\s+\d{2}){3,}[\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000)
}

async function applyTranslationFromPdf(bundle, examId) {
  const resolver = ANALYSIS_PDF[examId]
  if (!resolver) return 0
  let n = 0
  for (const item of bundle.translation ?? []) {
    if (item.en?.trim() && !/需对照|待补/.test(item.notes ?? '')) continue
    const key = `${examId}-${item.examPaper}`
    if (TRANSLATION_REFS[key]) continue
    const pdfPath = resolver(item.examPaper)
    if (!pdfPath || !fs.existsSync(pdfPath)) continue
    let text
    try {
      text = await readPdfText(pdfPath)
    } catch {
      continue
    }
    const en = parseTranslationEnFromPdf(text)
    if (!en || en.length < 60) continue
    applyTranslation(item, { en, notes: '参考译文来自官方解析 PDF。' })
    n += 1
  }
  return n
}

async function applyWritingFromPdf(bundle, examId) {
  const resolver = ANALYSIS_PDF[examId]
  if (!resolver) return 0
  let n = 0
  for (const item of bundle.writing ?? []) {
    const key = `${examId}-${item.examPaper}`
    if (WRITING_SAMPLES[key]) continue
    if (item.sample?.trim() && !/见速查|待补/.test(item.sample)) continue
    const pdfPath = resolver(item.examPaper)
    if (!pdfPath || !fs.existsSync(pdfPath)) continue
    let text
    try {
      text = await readPdfText(pdfPath)
    } catch {
      continue
    }
    const sample = parseWritingSampleFromPdf(text)
    if (!sample || sample.length < 80) continue
    item.sample = sample
    n += 1
  }
  return n
}

async function applyListeningAnswers(bundle, examId) {
  const resolver = ANALYSIS_PDF[examId]
  if (!resolver) return 0
  let updated = 0
  const sets = new Set(
    (bundle.listening ?? []).map((i) => i.examPaper).filter(Boolean),
  )
  for (const setNum of sets) {
    const pdfPath = resolver(setNum)
    if (!pdfPath || !fs.existsSync(pdfPath)) continue
    let text
    try {
      text = await readPdfText(pdfPath)
    } catch {
      continue
    }
    const answers = parseAnalysisListeningAnswersFull(text)
    if (!answers.size) continue
    for (const item of bundle.listening ?? []) {
      if (item.examPaper !== setNum) continue
      for (const q of item.questions ?? []) {
        const num = Number(/^q(\d+)$/.exec(q.id ?? '')?.[1] ?? NaN)
        if (!Number.isFinite(num)) continue
        const letter = answers.get(num)
        if (!letter) continue
        if (/答案见速查册|答案待核对/.test(q.explanation ?? '')) {
          q.answerIndex = LETTER_INDEX[letter] ?? 0
          q.explanation = `官方答案：${letter}。（摘自解析 PDF）`
          updated += 1
        }
      }
    }
  }
  return updated
}

async function main() {
  let totalTr = 0
  let totalW = 0
  let totalL = 0
  let totalTrPdf = 0
  let totalWPdf = 0

  for (const name of fs.readdirSync(examsDir)) {
    if (!name.endsWith('.json')) continue
    const examId = name.replace('.json', '')
    const file = path.join(examsDir, name)
    const bundle = JSON.parse(fs.readFileSync(file, 'utf8'))
    let changed = false

    for (const item of bundle.translation ?? []) {
      const key = `${examId}-${item.examPaper}`
      const ref = TRANSLATION_REFS[key]
      if (!ref) continue
      applyTranslation(item, ref)
      totalTr += 1
      changed = true
    }

    const trPdf = await applyTranslationFromPdf(bundle, examId)
    totalTrPdf += trPdf
    if (trPdf) changed = true

    for (const item of bundle.writing ?? []) {
      const key = `${examId}-${item.examPaper}`
      const sample = WRITING_SAMPLES[key]
      if (!sample) continue
      if (!item.sample?.trim() || /见速查|待补/.test(item.sample)) {
        item.sample = sample
        totalW += 1
        changed = true
      }
    }

    const wPdf = await applyWritingFromPdf(bundle, examId)
    totalWPdf += wPdf
    if (wPdf) changed = true

    const l = await applyListeningAnswers(bundle, examId)
    totalL += l
    if (l) changed = true

    if (changed) {
      fs.writeFileSync(file, JSON.stringify(bundle, null, 2), 'utf8')
      console.log(`${name}: patched`)
    }
  }

  console.log(
    `Done. Manual translations: ${totalTr}, PDF translations: ${totalTrPdf}, manual writing: ${totalW}, PDF writing: ${totalWPdf}, listening answers: ${totalL}.`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
