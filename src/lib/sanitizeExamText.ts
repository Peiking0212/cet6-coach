/** Remove PDF export artifacts (page markers, headers, watermarks). */
export function cleanPdfArtifacts(text: string): string {
  if (!text?.trim()) return text
  return (
    text
      .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, ' ')
      .replace(
        /\d{4}\s*年\s*\d{1,2}\s*月\s*英语六级真题[\s\S]*?(?:--\s*\d+\s+of\s+\d+\s*--)?/gi,
        ' ',
      )
      .replace(/\d{4}(?:\s*\d)*\s*年(?:\s*\d)+\s*月\s*英语六级真题[\s\S]{0,100}?(?:页|共)/gi, ' ')
      .replace(/\d{4}\s*年\s*\d{1,2}\s*月英语六级真题第\d+[^.]*?(?:页|共)[^.]*/gi, ' ')
      .replace(/\d{4}年\d{1,2}月英语六级真题第\d+套第[^。]+页共[^。]+页/gi, ' ')
      .replace(/\d{2,4}\s*年\s*\d{1,2}\s*月英语六级真题[^.]*?页[^.]*?/gi, ' ')
      .replace(/20(?:\s*\d){2}\s*年(?:\s*\d)+\s*月\s*英语六级真题/gi, ' ')
      .replace(/第\s*\d+\s*套\s*第\s*[^\s。]{1,4}\s*页\s*共\s*[^\s.]+\s*页/gi, ' ')
      .replace(/第\s*\d+\s*套\s*第\s*\d+\s*页\s*共\s*[^\s.]+\s*页/gi, ' ')
      .replace(
        /第\s*\d(?:\s*\d)*\s*套\s*第\s*\d(?:\s*\d)*\s*页\s*共\s*\d(?:\s*\d)*\s*页/gi,
        ' ',
      )
      .replace(/\s+b\s*y\s*:\s*新一文化\s*/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  )
}

/** Strip questions accidentally merged into a reading passage during PDF import. */
export function cleanCarefulPassage(
  passage: string,
  questions: { stem: string }[],
): string {
  let text = cleanPdfArtifacts(passage)

  for (const q of questions) {
    const snippet = q.stem.slice(0, Math.min(50, q.stem.length)).trim()
    if (snippet.length < 12) continue
    const idx = text.indexOf(snippet)
    if (idx > 80) {
      text = text.slice(0, idx)
      break
    }
  }

  const m = text.match(
    /\s((?:4[6-9])|(?:5[0-5]))\.\s+(?:What|How|Why|Which|According|It\s|They\s|The\s|One\s|In\s)/i,
  )
  if (m?.index != null && m.index > 80) {
    text = text.slice(0, m.index)
  }

  text = text.replace(/\s((?:4[6-9])|(?:5[0-5]))\.\s*$/i, '')

  return text.trim()
}

export function cleanMcqOption(text: string): string {
  return cleanPdfArtifacts(text.replace(/^[A-D][.)]\s*/i, ''))
}
