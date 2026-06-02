/**
 * Audit exam JSON bundles: questions present, no page markers, answers/explanations.
 * Run: node scripts/audit-exam-json.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const examsDir = path.join(__dirname, '../src/data/exams')

const PAGE_MARKERS =
  /(--\s*\d+\s+of\s+\d+\s*--|英语六级真题|第\s*\d(?:\s*\d)*\s*套\s*第\s*\d(?:\s*\d)*\s*页\s*共|by\s*:\s*新一文化)/i

const SKIP_PATHS = /^(meta|gaps|audioManifest)($|\.|\[)/

function walkStrings(obj, fn, p = '') {
  if (typeof obj === 'string') {
    if (!SKIP_PATHS.test(p)) fn(obj, p)
    return
  }
  if (Array.isArray(obj)) obj.forEach((v, i) => walkStrings(v, fn, `${p}[${i}]`))
  else if (obj && typeof obj === 'object')
    for (const [k, v] of Object.entries(obj)) walkStrings(v, fn, p ? `${p}.${k}` : k)
}

function hasPageMarker(text) {
  return PAGE_MARKERS.test(text)
}

function auditBundle(id, bundle) {
  const issues = []
  let missingAnswer = 0
  let missingTranslation = 0
  let missingQuestions = 0

  const stats = {
    listening: { items: 0, questions: 0 },
    reading: { items: 0, questions: 0 },
    translation: { items: 0 },
    writing: { items: 0 },
  }

  for (const item of bundle.listening ?? []) {
    stats.listening.items++
    const qs = item.questions ?? []
    stats.listening.questions += qs.length
    if (qs.length === 0) {
      missingQuestions++
      issues.push({ level: 'error', mod: 'listening', id: item.id, msg: '无听力小题' })
    }
    for (const q of qs) {
      if (!q.stem?.trim())
        issues.push({ level: 'error', mod: 'listening', id: q.id, msg: '题干为空' })
      if (/答案见速查册|答案待核对/.test(q.explanation ?? '')) missingAnswer++
      if (!q.explanation?.trim())
        issues.push({ level: 'warn', mod: 'listening', id: q.id, msg: '无解析' })
    }
  }

  for (const item of bundle.reading ?? []) {
    stats.reading.items++
    if (item.kind === 'word_bank') {
      stats.reading.questions += item.blanks?.length ?? 0
      for (const b of item.blanks ?? []) {
        if (/答案待核对/.test(b.explanation ?? '')) missingAnswer++
      }
    } else if (item.kind === 'paragraph') {
      stats.reading.questions += item.statements?.length ?? 0
    } else {
      const qs = item.questions ?? []
      stats.reading.questions += qs.length
      if (qs.length === 0)
        issues.push({ level: 'error', mod: 'reading', id: item.id, msg: '无阅读小题' })
      for (const q of qs) {
        if (!q.explanation?.trim() || /答案待核对/.test(q.explanation))
          missingAnswer++
      }
    }
  }

  for (const item of bundle.translation ?? []) {
    stats.translation.items++
    if (!item.cn?.trim())
      issues.push({ level: 'error', mod: 'translation', id: item.id, msg: '缺少中文原文' })
    if (!item.en?.trim()) {
      missingTranslation++
      issues.push({ level: 'warn', mod: 'translation', id: item.id, msg: '缺少参考译文' })
    }
  }

  for (const item of bundle.writing ?? []) {
    stats.writing.items++
    if (!item.prompt?.trim())
      issues.push({ level: 'error', mod: 'writing', id: item.id, msg: '缺少题目' })
    if (!item.sample?.trim() || /见速查|待补/.test(item.sample ?? ''))
      issues.push({ level: 'warn', mod: 'writing', id: item.id, msg: '缺少范文' })
  }

  let pageHits = 0
  walkStrings(bundle, (text) => {
    if (hasPageMarker(text)) pageHits++
  })
  if (pageHits)
    issues.push({ level: 'warn', mod: 'bundle', id, msg: `${pageHits} 处含页码/水印文本` })

  const empty =
    stats.listening.items === 0 &&
    stats.reading.items === 0 &&
    stats.translation.items === 0 &&
    stats.writing.items === 0

  if (empty)
    issues.push({ level: 'error', mod: 'bundle', id, msg: '未导入题目（仅占位）' })

  return {
    id,
    issues,
    stats,
    gaps: bundle.gaps ?? [],
    missingAnswer,
    missingTranslation,
    missingQuestions,
    pageHits,
    empty,
  }
}

const reports = []
for (const name of fs.readdirSync(examsDir).sort()) {
  if (!name.endsWith('.json')) continue
  const id = name.replace('.json', '')
  const bundle = JSON.parse(fs.readFileSync(path.join(examsDir, name), 'utf8'))
  reports.push(auditBundle(id, bundle))
}

console.log('\n=== CET-6 真题数据检查 ===\n')

const ok = []
const partial = []
const empty = []

for (const r of reports) {
  const line =
    `${r.id}: 听力 ${r.stats.listening.questions}题 | 阅读 ${r.stats.reading.questions}题 | 翻译 ${r.stats.translation.items} | 写作 ${r.stats.writing.items}` +
    (r.missingAnswer ? ` | ⚠ ${r.missingAnswer}题缺答案` : '') +
    (r.missingTranslation ? ` | ⚠ ${r.missingTranslation}套缺译文` : '') +
    (r.pageHits ? ` | ⚠ 页码${r.pageHits}处` : '')

  if (r.empty) empty.push(line)
  else if (r.issues.some((i) => i.level === 'error') || r.missingAnswer > 10 || r.pageHits)
    partial.push(line)
  else ok.push(line)
}

if (ok.length) {
  console.log('✅ 基本完整:')
  ok.forEach((l) => console.log('  ' + l))
  console.log('')
}
if (partial.length) {
  console.log('⚠ 部分缺失/需改进:')
  partial.forEach((l) => console.log('  ' + l))
  for (const r of reports.filter((x) => partial.some((p) => p.startsWith(x.id)))) {
    for (const g of r.gaps.slice(0, 2)) console.log(`    · ${g}`)
  }
  console.log('')
}
if (empty.length) {
  console.log('❌ 未导入:')
  empty.forEach((l) => console.log('  ' + l))
  console.log('')
}

const totalMissingAns = reports.reduce((s, r) => s + r.missingAnswer, 0)
console.log(
  `合计: ${reports.length} 套卷 | ${ok.length} 套可用 | ${partial.length} 套部分问题 | ${empty.length} 套未导入 | ${totalMissingAns} 道听力/阅读题缺官方答案\n`,
)

process.exit(empty.length > 0 ? 1 : 0)
