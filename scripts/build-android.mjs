/**
 * Build web assets for Capacitor Android (base /, offline exam audio, no GitHub Pages 404).
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const env = {
  ...process.env,
  VITE_BASE_PATH: '/',
  VITE_NATIVE_APP: 'true',
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: true, env })
  if ((r.status ?? 1) !== 0) process.exit(r.status ?? 1)
}

run('npm', ['exec', '--', 'tsc', '-b'])
run('npm', ['exec', '--', 'vite', 'build'])
run('node', [path.join(__dirname, 'copy-exam-audio.mjs')])
run('npm', ['exec', '--', 'cap', 'sync', 'android'])
run('node', [path.join(__dirname, 'patch-android-gradle.mjs')])
console.log('\nAndroid web assets ready. Open Android Studio: npm run cap:open')
