/**
 * Copy public/audio/exams → dist/audio/exams for offline Android / local builds.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const src = path.join(root, 'public/audio/exams')
const dest = path.join(root, 'dist/audio/exams')

function copyDir(from, to) {
  if (!fs.existsSync(from)) return 0
  fs.mkdirSync(to, { recursive: true })
  let n = 0
  for (const name of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, name.name)
    const d = path.join(to, name.name)
    if (name.isDirectory()) n += copyDir(s, d)
    else if (name.name.endsWith('.mp3')) {
      fs.copyFileSync(s, d)
      n += 1
    }
  }
  return n
}

if (!fs.existsSync(path.join(root, 'dist'))) {
  console.error('dist/ not found — run vite build first.')
  process.exit(1)
}

const count = copyDir(src, dest)
if (count === 0) {
  console.warn(
    'No exam MP3 copied. Run import-exam first, e.g.:\n' +
      '  node scripts/import-exam.mjs --exam-id 2022-12 --source "E:/.../2022.12第1套" --sets 1 --merge',
  )
} else {
  console.log(`Copied ${count} exam MP3 file(s) to dist/audio/exams/`)
}
