/**
 * Patch 2024-12 translation reference English (from official 解析 / course materials).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const file = path.join(__dirname, '../src/data/exams/2024-12.json')

const REFS = {
  1: {
    en: "The successful development of the BeiDou Satellite Navigation System is a major scientific and technological achievement that China has made since the reform and opening-up. Through relentless efforts, researchers overcame a series of technical challenges, and the BeiDou system eventually achieved global coverage and high-precision positioning, making China one of the few countries in the world that independently possesses a global satellite navigation system. The BeiDou system has been widely used in many areas, including transportation, disaster relief, weather forecasting, and public security. The system has now gained extensive international recognition and begun to provide high-quality services to a growing number of countries and regions.",
    notes: '参考译文为应用内参考译法（六级真题风格）。',
  },
  2: {
    en: "Yangshan Port, a vital component of the Shanghai Shipping Center, serves as China's first deep-water port and one of the world's largest deep-water ports. Over nearly two decades of development, Yangshan Port has achieved a high level of automation. The employment of digital technology and artificial intelligence has significantly reduced labor costs and carbon emissions. The independently developed intelligent management system allows for the remote monitoring of large equipment from outside the office. In spite of the seeming busyness, Yangshan Port operates around the clock without the visible labor-intensive work. As Yangshan Port continues to evolve, it is set to make even greater contributions to the establishment of Shanghai as a global shipping hub.",
    notes: '参考译文来自官方解析（Alpass 一笑而过）。',
  },
  3: {
    en: "Roaming the cosmos has always been a dream of the Chinese nation. In 2003, the successful launch of the Shenzhou-5 spacecraft marked a historic moment as Yang Liwei became the first Chinese astronaut to venture into space. In 2008, the Shenzhou-7 mission was launched, and Zhai Zhigang made history as the first Chinese astronaut to perform a spacewalk. In recent years, China's space industry has entered a period of rapid innovation and development, with the steady progress of space infrastructure construction. The completion of the Chinese Space Station in 2022 has written a brilliant chapter in the history of the Chinese nation and made significant contributions to the progress of human civilization. In the future, China's steps in space exploration will become more stable and reach farther.",
    notes: '参考译文来自官方解析（Alpass 一笑而过）。',
  },
}

function splitEn(en) {
  return en
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const bundle = JSON.parse(fs.readFileSync(file, 'utf8'))
for (const item of bundle.translation ?? []) {
  const ref = REFS[item.examPaper]
  if (!ref) continue
  item.en = ref.en
  item.notes = ref.notes
  const enParts = splitEn(ref.en)
  if (enParts.length === item.sentences.length) {
    item.sentences = item.sentences.map((s, i) => ({ ...s, en: enParts[i] }))
  } else {
    item.sentences = item.sentences.map((s) => ({ ...s, en: ref.en }))
  }
}

fs.writeFileSync(file, JSON.stringify(bundle, null, 2), 'utf8')
console.log('Patched 2024-12 translation sets 1–3.')
