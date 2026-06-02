/**
 * Remove Capacitor Cordova flatDir repos (empty libs → IDE warning). Re-run after cap sync.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const files = [
  path.join(root, 'android/app/build.gradle'),
  path.join(root, 'android/capacitor-cordova-android-plugins/build.gradle'),
]

for (const file of files) {
  if (!fs.existsSync(file)) continue
  let text = fs.readFileSync(file, 'utf8')
  const next = text.replace(/\s*flatDir\s*\{[^}]*\}/g, '')
  if (next !== text) {
    fs.writeFileSync(file, next, 'utf8')
    console.log('patch-android-gradle: removed flatDir from', path.relative(root, file))
  }
}
