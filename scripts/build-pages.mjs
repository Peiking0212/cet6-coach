import { spawnSync } from 'node:child_process'

process.env.VITE_BASE_PATH = '/cet6-coach/'
const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true })
process.exit(result.status ?? 1)
