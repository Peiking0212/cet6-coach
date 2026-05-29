import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const vocabPath = path.join(rootDir, 'src/data/vocabulary.json')
const enrichmentPath = path.join(__dirname, 'vocab-memory-data.json')

const vocabulary = JSON.parse(fs.readFileSync(vocabPath, 'utf8'))
const enrichment = JSON.parse(fs.readFileSync(enrichmentPath, 'utf8'))

const merged = vocabulary.map((word) => {
  const extra = enrichment[word.id]
  if (!extra) {
    console.warn(`Warning: no enrichment for ${word.id}`)
    return word
  }

  return {
    ...word,
    ...(extra.root ? { root: extra.root } : {}),
    collocations: extra.collocations,
    memoryTip: extra.memoryTip,
  }
})

fs.writeFileSync(vocabPath, JSON.stringify(merged, null, 2) + '\n', 'utf8')

const withRoot = merged.filter((w) => w.root).length
const withCollocations = merged.filter((w) => w.collocations?.length).length
const withMemoryTip = merged.filter((w) => w.memoryTip).length

console.log(`Merged ${merged.length} words into ${vocabPath}`)
console.log(`  with root: ${withRoot}`)
console.log(`  with collocations: ${withCollocations}`)
console.log(`  with memoryTip: ${withMemoryTip}`)
