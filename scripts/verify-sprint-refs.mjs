/**
 * Verify sprint plan itemRefs against imported exam bundles + builtin banks.
 * Usage: node scripts/verify-sprint-refs.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const examsDir = path.join(rootDir, 'src/data/exams')

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function collectIds() {
  const ids = new Set()
  for (const m of ['listening', 'reading', 'translation', 'writing']) {
    for (const item of loadJson(path.join(rootDir, `src/data/${m}.json`))) ids.add(item.id)
  }
  for (const f of fs.readdirSync(examsDir)) {
    if (!f.endsWith('.json')) continue
    const bundle = loadJson(path.join(examsDir, f))
    for (const key of ['listening', 'reading', 'translation', 'writing']) {
      for (const item of bundle[key] ?? []) ids.add(item.id)
    }
  }
  return ids
}

function parsePlanRefs(planText) {
  const ids = new Set()

  for (const m of planText.matchAll(/listen\(\s*['"]([\d-]+)['"]\s*,\s*(\d+)\s*,\s*([^)]+)\)/g)) {
    const parts = m[3].split(',').map((s) => s.trim().replace(/['"]/g, ''))
    for (const p of parts) ids.add(`${m[1]}-set${m[2]}-listen-${p}`)
  }

  for (const m of planText.matchAll(
    /listenBlock\(\s*['"]([\d-]+)['"]\s*,\s*(\d+)\s*\)/g,
  )) {
    for (const p of ['pass1', 'pass2', 'conv1', 'conv2']) {
      ids.add(`${m[1]}-set${m[2]}-listen-${p}`)
    }
  }

  for (const m of planText.matchAll(
    /read\(\s*['"]([\d-]+)['"]\s*,\s*(\d+)\s*,\s*['"](\w+)['"](?:\s*,\s*(\d+))?\s*\)/g,
  )) {
    const exam = m[1]
    const set = m[2]
    const kind = m[3]
    if (kind === 'careful') ids.add(`${exam}-set${set}-read-careful-${m[4]}`)
    else if (kind === 'paragraph') ids.add(`${exam}-set${set}-read-paragraph`)
    else ids.add(`${exam}-set${set}-read-cloze`)
  }

  for (const m of planText.matchAll(/write\(\s*['"]([\d-]+)['"]\s*,\s*(\d+)\s*\)/g)) {
    ids.add(`${m[1]}-set${m[2]}-writing`)
  }

  for (const m of planText.matchAll(/trans\(\s*['"]([\d-]+)['"]\s*,\s*(\d+)\s*\)/g)) {
    ids.add(`${m[1]}-set${m[2]}-translation`)
  }

  for (const m of planText.matchAll(
    /ref\(\s*['"](?:listening|reading|translation|writing)['"]\s*,\s*([^)]+)\)/g,
  )) {
    for (const id of m[1].matchAll(/['"`](20\d{2}-\d{2}-set\d+-[^'"`\s]+)['"`]/g)) {
      ids.add(id[1])
    }
  }

  for (const m of planText.matchAll(
    /\[([\s\S]*?)\]\.map\(\s*\(\s*\w+\s*\)\s*=>\s*`(20\d{2}-\d{2})-set(\d+)-listen-\$\{\w+\}`/g,
  )) {
    const parts = [...m[1].matchAll(/['"](\w+)['"]/g)].map((x) => x[1])
    for (const p of parts) ids.add(`${m[2]}-set${m[3]}-listen-${p}`)
  }

  return [...ids].filter((id) =>
    /^20\d{2}-\d{2}-set\d+-(listen-(?:conv[12]|pass[12]|lec[123])|read-(?:careful-[12]|paragraph|cloze)|writing|translation)$/.test(
      id,
    ),
  )
}

const allIds = collectIds()
const planText = fs.readFileSync(path.join(rootDir, 'src/sprint/plan.ts'), 'utf8')
const refs = parsePlanRefs(planText)
const missing = refs.filter((id) => !allIds.has(id))

console.log(`Total unique item IDs in banks: ${allIds.size}`)
console.log(`Sprint plan references: ${refs.length}`)
if (missing.length) {
  console.log(`\nMissing (${missing.length}) — run import-exam for each year:`)
  for (const id of missing.sort()) console.log(`  ${id}`)
  process.exit(1)
} else {
  console.log('\nAll sprint item references resolved.')
}
