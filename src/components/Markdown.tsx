import type { ReactNode } from 'react'

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // split on **bold** and `code`
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g
  const parts = text.split(regex)
  parts.forEach((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      nodes.push(<strong key={i}>{p.slice(2, -2)}</strong>)
    } else if (p.startsWith('`') && p.endsWith('`')) {
      nodes.push(<code key={i}>{p.slice(1, -1)}</code>)
    } else if (p) {
      nodes.push(<span key={i}>{p}</span>)
    }
  })
  return nodes
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let list: string[] = []
  let key = 0

  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${key++}`}>
          {list.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>,
      )
      list = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (/^#{1,6}\s/.test(line)) {
      flushList()
      const level = line.match(/^#+/)![0].length
      const content = line.replace(/^#+\s/, '')
      const H = `h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements
      blocks.push(<H key={`h-${key++}`}>{inline(content)}</H>)
    } else if (/^\s*[-*]\s/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s/, ''))
    } else if (/^\s*\d+\.\s/.test(line)) {
      list.push(line.replace(/^\s*\d+\.\s/, ''))
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      blocks.push(<p key={`p-${key++}`}>{inline(line)}</p>)
    }
  }
  flushList()

  return <div className="markdown">{blocks}</div>
}
