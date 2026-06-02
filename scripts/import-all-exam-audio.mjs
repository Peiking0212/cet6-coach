/**
 * Copy all known exam listening MP3s from BaiduNetdiskDownload into public/audio/exams/.
 * Run before npm run build:android so the APK includes audio.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const importScript = path.join(__dirname, 'import-exam.mjs')

const JOBS = [
  { examId: '2022-09', sets: '1,2,3' },
  { examId: '2022-12', sets: '1' },
  { examId: '2023-06', sets: '1' },
  { examId: '2023-12', sets: '1,2' },
  { examId: '2024-06', sets: '1,2' },
]

let failed = 0
for (const { examId, sets } of JOBS) {
  console.log(`\n=== ${examId} (sets ${sets}) ===`)
  const r = spawnSync(
    process.execPath,
    [importScript, '--exam-id', examId, '--sets', sets, '--audio-only'],
    { stdio: 'inherit' },
  )
  if ((r.status ?? 1) !== 0) failed += 1
}

if (failed) {
  console.error(`\n${failed} exam(s) missing MP3 — check paths in scripts/import-exam.mjs`)
  process.exit(1)
}
console.log('\nAll exam audio copied to public/audio/exams/. Next: npm run build:android')
