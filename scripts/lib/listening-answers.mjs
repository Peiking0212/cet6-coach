/** Extract CET-6 listening answers (1–25) from 解析 PDF text. */

export function extractAnswerLetterFromChunk(chunk) {
  const m =
    chunk.match(/(?:故\s*)?([A-D])项与[^。\n]{0,120}相符/) ||
    chunk.match(/故选\s*([A-D])/) ||
    chunk.match(/(?:故)?选\s*([A-D])(?:\s*项)?/) ||
    chunk.match(/(?:答案|正确答案)[：:为是]\s*[\s\n]*选项?\s*([A-D])/i) ||
    chunk.match(/(?:答案|正确答案)[：:为是]\s*([A-D])/i) ||
    chunk.match(/第\s*\d+\s*题[^。\n]{0,120}?([A-D])\s*项/) ||
    chunk.match(/选项\s*([A-D])\s*是[^。]{0,800}?故为正确选项/) ||
    chunk.match(/选项\s*([A-D])\s*是对[^。]{0,800}?故为正确选项/) ||
    chunk.match(/选项\s*([A-D])[^。]{0,500}?为正确选项/) ||
    chunk.match(/选项\s*([A-D])\s*正确/) ||
    chunk.match(/选项\s*([A-D])[^。]{0,300}?故为正确选项/) ||
    chunk.match(/([A-D])\s*项[^。]{0,120}?为正确选项/) ||
    chunk.match(/选项\s*([A-D])\s*为正确答案/) ||
    chunk.match(/故\s*([A-D])\s*项为正确答案/) ||
    chunk.match(/故选项\s*([A-D])\s*为正确答案/) ||
    chunk.match(/选项\s*([A-D])\s*为正[\s\S]{0,40}?确答案/) ||
    chunk.match(/选项\s*([A-D])[^。]{0,100}?正确[，,]/) ||
    chunk.match(/选项\s*([A-D])[\s\S]{0,200}?正确/) ||
    chunk.match(/选项\s*([A-D])[^。]{0,120}?[）)]\s*[\s\S]{0,120}?正确/) ||
    chunk.match(/([A-D])[\s\S]{0,60}?[：:]\s*正确[，,]/)
  return m?.[1]?.toUpperCase() ?? null
}

/** Split 答案详解 by English stems; map explanation blocks to question numbers. */
export function parseListeningAnswersFromJieXi(text) {
  const map = new Map()
  const detailStart = text.search(/答案详解|答案解析|听力.*?(?:解析|详解)/i)
  const sec = detailStart >= 0 ? text.slice(detailStart) : text

  const stems = [
    ...text.matchAll(
      /(\d{1,2})[.．、]\s*(?:What|Why|How|Which|Where|Who|According|Wat|To\s)/gi,
    ),
  ]
  if (!stems.length) return map

  const pre = text.slice(0, stems[0].index)
  const preLetter = extractAnswerLetterFromChunk(pre)
  const firstN = Number(stems[0][1])
  if (preLetter && firstN > 1) map.set(firstN - 1, preLetter)

  for (let i = 0; i < stems.length; i++) {
    const n = Number(stems[i][1])
    const chunkStart = stems[i].index
    const chunkEnd = stems[i + 1]?.index ?? text.length
    const chunk = text.slice(chunkStart, chunkEnd)
    const letter = extractAnswerLetterFromChunk(chunk)
    if (letter) map.set(n, letter)
  }
  return map
}

/** Regex sweep + block parser merged. */
export function parseAnalysisListeningAnswersFull(text) {
  const map = new Map()
  const patterns = [
    /(\d{1,2})[.．、]\s*[\s\S]{0,2800}?(?:故)?\s*([A-D])\s*项与[^。\n]{2,120}相符/g,
    /(\d{1,2})[.．、][\s\S]{0,2000}?故\s*([A-D])\s*项为正确答案/g,
    /(\d{1,2})[.．、][\s\S]{0,2000}?故选\s*([A-D])/g,
    /(\d{1,2})[.．、][\s\S]{0,1200}?(?:故)?选\s*([A-D])(?:\s*项)?/g,
    /(\d{1,2})[.．、][\s\S]{0,1200}?正确答案[：:为是]\s*([A-D])/gi,
    /第\s*(\d{1,2})\s*题[\s\S]{0,400}?答案[：:为是]\s*([A-D])/gi,
    /(\d{1,2})[.．、][\s\S]{0,2500}?选项\s*([A-D])\s*是[^。]{0,800}?故为正确选项/g,
    /(\d{1,2})[.．、][\s\S]{0,2500}?选项\s*([A-D])[^。]{0,300}?故为正确选项/g,
  ]
  for (const re of patterns) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) {
      const n = Number(m[1])
      if (n >= 1 && n <= 25) map.set(n, m[2].toUpperCase())
    }
  }
  for (const [n, letter] of parseListeningAnswersFromJieXi(text)) {
    if (!map.has(n)) map.set(n, letter)
  }
  return map
}
