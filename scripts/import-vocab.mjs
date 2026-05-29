/**
 * Import CET-6 vocabulary from local files / CSV / JSON into src/data/*.json
 *
 * Usage:
 *   node scripts/import-vocab.mjs
 *   node scripts/import-vocab.mjs --sources config.json
 *
 * Personal study materials only — do not redistribute copyrighted content.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import WordExtractor from 'word-extractor'
import { PDFParse } from 'pdf-parse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const dataDir = path.join(rootDir, 'src/data')

const DEFAULT_SOURCES = {
  disorderedDoc: 'e:/download2/六级词汇表-乱序.doc',
  highfreqPdf: 'e:/download2/赠-大学英语六级-高频词汇.pdf',
  phrasesPdf: 'e:/download2/赠-英语六级高频词组.pdf',
  bbdcCorePdf: 'http://static.beingfine.cn/pdf/bbdc_50476351_20250916222540.pdf',
  bbdcExtraPdf: 'http://static.beingfine.cn/pdf/bbdc_50476351_20250916222607.pdf',
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'item'
}

function makeId(prefix, text) {
  return `${prefix}-${slug(text)}`
}

function emptyWord(partial) {
  return {
    id: partial.id,
    word: partial.word,
    phonetic: partial.phonetic ?? '',
    pos: partial.pos ?? '',
    meaning: partial.meaning ?? '',
    example: partial.example ?? '',
    exampleCn: partial.exampleCn ?? '',
    tags: partial.tags ?? [],
    ...(partial.root ? { root: partial.root } : {}),
    ...(partial.collocations?.length ? { collocations: partial.collocations } : {}),
    ...(partial.memoryTip ? { memoryTip: partial.memoryTip } : {}),
    ...(partial.synonyms?.length ? { synonyms: partial.synonyms } : {}),
  }
}

function dedupeByWord(words) {
  const seen = new Map()
  for (const w of words) {
    const key = w.word.toLowerCase()
    if (!seen.has(key)) seen.set(key, w)
  }
  return [...seen.values()]
}

function extractPosAndMeaning(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  const posMatch = cleaned.match(/^((?:n|v|vi|vt|adj|adv|prep|conj|interj|pron|art)\.)\s*/i)
  if (posMatch) {
    return { pos: posMatch[1], meaning: cleaned.slice(posMatch[0].length).trim() }
  }
  if (/^phr\.|^phrv\.|^idiom/i.test(cleaned)) {
    return { pos: 'phr.', meaning: cleaned.replace(/^(phr\.|phrv\.|idiom\.?)\s*/i, '').trim() }
  }
  return { pos: '', meaning: cleaned }
}

async function readPdf(source) {
  const parser = new PDFParse(
    source.startsWith('http') ? { url: source } : { data: fs.readFileSync(source) },
  )
  const result = await parser.getText()
  await parser.destroy()
  return result.text
}

async function parseDisorderedDoc(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip missing DOC: ${filePath}`)
    return []
  }
  const extractor = new WordExtractor()
  const doc = await extractor.extract(filePath)
  const lines = doc.getBody().split(/\r?\n/)
  const words = []

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\d+)\.\s+(\S+)\s+(\/[^/]+\/)\s*$/)
    if (!m) continue
    const [, , word, phonetic] = m
    i++
    const defParts = []
    while (i < lines.length && !/^\d+\.\s+\S+/.test(lines[i])) {
      if (lines[i].trim()) defParts.push(lines[i].trim())
      i++
    }
    i--
    const { pos, meaning } = extractPosAndMeaning(defParts.join(' '))
    words.push(
      emptyWord({
        id: makeId('d', word),
        word,
        phonetic,
        pos,
        meaning,
        tags: ['六级乱序'],
      }),
    )
  }
  return dedupeByWord(words)
}

function parseHighfreqPdfText(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  const words = []
  let buf = ''

  for (const line of lines) {
    if (/^大学英语六级高频词汇/.test(line)) continue
    const chunk = buf ? `${buf} ${line}` : line
    const m = chunk.match(/^(\d+)\.\s+(\S+)\s+(\/[^/]+\/)\s*(.*)$/)
    if (m) {
      const [, , word, phonetic, rest] = m
      const { pos, meaning } = extractPosAndMeaning(rest.trim())
      words.push(
        emptyWord({
          id: makeId('h', word),
          word,
          phonetic,
          pos,
          meaning,
          tags: ['六级高频'],
        }),
      )
      buf = ''
    } else if (/^\d+\.\s+\S+/.test(line)) {
      buf = line
    } else if (buf) {
      buf = `${buf} ${line}`
    }
  }
  return dedupeByWord(words)
}

async function parseHighfreqPdf(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip missing PDF: ${filePath}`)
    return []
  }
  const text = await readPdf(filePath)
  return parseHighfreqPdfText(text)
}

function parsePhraseLine(raw) {
  const cleaned = raw.replace(/欢迎下载.*$/, '').trim()
  const m = cleaned.match(/^(\d+)\.\s+(.+?)([\u4e00-\u9fff].*)$/)
  if (!m) return null
  const phrase = m[2].replace(/\(\=.*?\)/g, '').trim().replace(/\s+/g, ' ')
  let meaning = m[3].replace(/^[。．.\s]+/, '').replace(/[。．.\s]+$/, '').trim()
  meaning = meaning.replace(/\(\=.*?\)/g, '').trim()
  if (!phrase || !meaning) return null
  return { phrase, meaning }
}

function parsePhrasesPdfText(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  const items = []
  let buf = ''

  for (const line of lines) {
    if (/^大学英语六级高频词组/.test(line)) continue
    const chunk = buf ? `${buf} ${line}` : line
    const parsed = parsePhraseLine(chunk)
    if (parsed) {
      items.push(parsed)
      buf = ''
    } else if (/^\d+\.\s+/.test(line)) {
      buf = line
    } else if (buf) {
      buf = `${buf} ${line}`
    }
  }
  return items
}

async function parsePhrasesPdf(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip missing PDF: ${filePath}`)
    return []
  }
  const text = await readPdf(filePath)
  return parsePhrasesPdfText(text)
}

function parseNumberedBlock(blockText) {
  const items = new Map()
  const lines = blockText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^Word Meaning$/i.test(l))

  let currentNum = null
  let parts = []

  const flush = () => {
    if (currentNum !== null && parts.length) {
      items.set(currentNum, parts.join(' ').replace(/\s+/g, ' ').trim())
    }
  }

  for (const line of lines) {
    const m = line.match(/^(\d+)\s+(.*)$/)
    if (m) {
      flush()
      currentNum = Number(m[1])
      parts = [m[2]]
    } else if (currentNum !== null) {
      parts.push(line)
    }
  }
  flush()
  return items
}

function cleanBbdcMeaning(raw) {
  return raw
    .split(/\s*(?=usage\.|idm\.|phrv\.|phr\.|collocation\.)/i)
    .map((s) => s.replace(/^(usage\.|idm\.|phrv\.|phr\.|collocation\.)\s*/i, '').trim())
    .filter(Boolean)
    .join('；')
}

function parseBbdcPdfText(text) {
  const chunks = text.split(/Word Meaning/i).map((c) => c.trim()).filter(Boolean)
  const englishBlocks = []
  const chineseBlocks = []

  for (const chunk of chunks) {
    if (/^(\d+\s+|[\u4e00-\u9fff])/.test(chunk) && /\d+\s+\S/.test(chunk.slice(0, 200))) {
      if (/usage\.|idm\.|phrv\.|collocation\./i.test(chunk)) chineseBlocks.push(chunk)
      else englishBlocks.push(chunk)
    }
  }

  const pairs = []
  const count = Math.min(englishBlocks.length, chineseBlocks.length)
  for (let i = 0; i < count; i++) {
    const en = parseNumberedBlock(englishBlocks[i])
    const zh = parseNumberedBlock(chineseBlocks[i])
    for (const [num, phrase] of en) {
      const meaningRaw = zh.get(num)
      if (!phrase || !meaningRaw) continue
      pairs.push({
        phrase: phrase.replace(/\s+/g, ' ').trim(),
        meaning: cleanBbdcMeaning(meaningRaw),
      })
    }
  }
  return dedupeByWord(
    pairs.map(({ phrase, meaning }) =>
      emptyWord({
        id: makeId('bbdc', phrase),
        word: phrase,
        pos: 'phr.',
        meaning,
        tags: ['百词斩'],
      }),
    ),
  )
}

async function parseBbdcPdf(source, tag) {
  try {
    const text = await readPdf(source)
    const items = parseBbdcPdfText(text)
    return items.map((w) => ({ ...w, tags: [...new Set([...(w.tags ?? []), tag])] }))
  } catch (e) {
    console.warn(`Failed BBDC PDF ${source}: ${e.message}`)
    return []
  }
}

function phrasesToWords(items, idPrefix, tag) {
  return dedupeByWord(
    items.map(({ phrase, meaning }) =>
      emptyWord({
        id: makeId(idPrefix, phrase),
        word: phrase,
        pos: 'phr.',
        meaning,
        tags: [tag],
      }),
    ),
  )
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return []
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const idx = (name) => header.indexOf(name)

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim())
    const word = cols[idx('word')] ?? cols[0]
    return emptyWord({
      id: makeId('csv', word),
      word,
      phonetic: cols[idx('phonetic')] ?? '',
      pos: cols[idx('pos')] ?? '',
      meaning: cols[idx('meaning')] ?? cols[1] ?? '',
      example: cols[idx('example')] ?? '',
      exampleCn: cols[idx('examplecn')] ?? cols[idx('example_cn')] ?? '',
      tags: ['导入'],
    })
  })
}

function parseJsonImport(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const arr = Array.isArray(raw) ? raw : raw.words ?? []
  return arr.map((w) =>
    emptyWord({
      id: w.id ?? makeId('json', w.word),
      word: w.word,
      phonetic: w.phonetic ?? '',
      pos: w.pos ?? '',
      meaning: w.meaning ?? '',
      example: w.example ?? '',
      exampleCn: w.exampleCn ?? w.example_cn ?? '',
      root: w.root,
      collocations: w.collocations,
      memoryTip: w.memoryTip ?? w.memory_tip,
      synonyms: w.synonyms,
      tags: w.tags ?? ['导入'],
    }),
  )
}

function attachCollocations(wordLists, phraseLists) {
  const byWord = new Map()
  for (const list of wordLists) {
    for (const w of list) {
      byWord.set(w.word.toLowerCase(), w)
    }
  }

  let attached = 0
  for (const phrases of phraseLists) {
    for (const p of phrases) {
      const head = p.word.split(/\s+/)[0]?.toLowerCase()
      if (!head) continue
      const target = byWord.get(head)
      if (!target) continue
      const col = p.word
      if (!target.collocations) target.collocations = []
      if (!target.collocations.includes(col)) {
        target.collocations.push(col)
        attached++
      }
    }
  }
  return attached
}

function loadExistingCurated() {
  const p = path.join(dataDir, 'vocabulary.json')
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function mergePreserveCurated(existing, imported, idPrefix) {
  const existingByWord = new Map(existing.map((w) => [w.word.toLowerCase(), w]))
  return imported.map((w) => {
    const prev = existingByWord.get(w.word.toLowerCase())
    if (!prev) return w
    return {
      ...w,
      id: w.id.startsWith(idPrefix) ? w.id : prev.id,
      phonetic: prev.phonetic || w.phonetic,
      pos: prev.pos || w.pos,
      meaning: prev.meaning || w.meaning,
      example: prev.example || w.example,
      exampleCn: prev.exampleCn || w.exampleCn,
      root: prev.root ?? w.root,
      memoryTip: prev.memoryTip ?? w.memoryTip,
      collocations: [...new Set([...(prev.collocations ?? []), ...(w.collocations ?? [])])],
      synonyms: prev.synonyms ?? w.synonyms,
      tags: [...new Set([...(w.tags ?? []), ...(prev.tags ?? []), '精选重叠'])],
    }
  })
}

function writeJson(name, data) {
  const out = path.join(dataDir, name)
  fs.writeFileSync(out, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${data.length} entries → ${path.relative(rootDir, out)}`)
  return data.length
}

async function main() {
  const args = process.argv.slice(2)
  let sources = { ...DEFAULT_SOURCES }
  const extraFiles = []

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--csv' && args[i + 1]) extraFiles.push({ type: 'csv', path: args[++i] })
    if (args[i] === '--json' && args[i + 1]) extraFiles.push({ type: 'json', path: args[++i] })
    if (args[i] === '--sources' && args[i + 1]) {
      sources = { ...sources, ...JSON.parse(fs.readFileSync(args[++i], 'utf8')) }
    }
  }

  console.log('Importing CET-6 vocabulary sources...\n')
  const curated = loadExistingCurated()

  const disordered = await parseDisorderedDoc(sources.disorderedDoc)
  const highfreq = await parseHighfreqPdf(sources.highfreqPdf)
  const giftPhrases = await parsePhrasesPdf(sources.phrasesPdf)
  const bbdcCore = await parseBbdcPdf(sources.bbdcCorePdf, '百词斩·核心词组')
  const bbdcExtra = await parseBbdcPdf(sources.bbdcExtraPdf, '百词斩·拓展词组')

  const disorderedMerged = mergePreserveCurated(curated, disordered, 'd')
  const highfreqMerged = mergePreserveCurated(curated, highfreq, 'h')

  const giftPhraseWords = phrasesToWords(giftPhrases, 'ph', '高频词组')
  const bbdcPhrases = dedupeByWord([...bbdcCore, ...bbdcExtra].map((w) => ({
    ...w,
    id: makeId('bbdc', w.word),
    tags: [...new Set([...(w.tags ?? []), '百词斩词表'])],
  })))

  attachCollocations([curated, disorderedMerged, highfreqMerged], [giftPhraseWords, bbdcPhrases])

  const counts = {
    curated: curated.length,
    disordered: writeJson('vocabulary-cet6-disordered.json', disorderedMerged),
    highfreq: writeJson('vocabulary-highfreq.json', highfreqMerged),
    giftPhrases: writeJson('vocabulary-phrases-gift.json', giftPhraseWords),
    bbdc: writeJson('vocabulary-bbdc-phrases.json', bbdcPhrases),
  }

  for (const f of extraFiles) {
    if (!fs.existsSync(f.path)) {
      console.warn(`Skip missing ${f.type}: ${f.path}`)
      continue
    }
    const text = fs.readFileSync(f.path, 'utf8')
    const items = f.type === 'csv' ? parseCsv(text) : parseJsonImport(f.path)
    const base = path.basename(f.path, path.extname(f.path))
    writeJson(`vocabulary-import-${slug(base)}.json`, dedupeByWord(items))
  }

  const overlap = (a, b) => {
    const setB = new Set(b.map((w) => w.word.toLowerCase()))
    return a.filter((w) => setB.has(w.word.toLowerCase())).length
  }

  console.log('\n--- Summary ---')
  console.log(`Curated (unchanged): ${counts.curated}`)
  console.log(`六级乱序: ${counts.disordered}`)
  console.log(`六级高频词汇: ${counts.highfreq}`)
  console.log(`高频词组 (赠): ${counts.giftPhrases}`)
  console.log(`百词斩词表: ${counts.bbdc}`)
  console.log(`Overlap curated↔乱序: ${overlap(curated, disorderedMerged)}`)
  console.log(`Overlap curated↔高频: ${overlap(curated, highfreqMerged)}`)
  console.log(`Overlap 乱序↔高频: ${overlap(disorderedMerged, highfreqMerged)}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
