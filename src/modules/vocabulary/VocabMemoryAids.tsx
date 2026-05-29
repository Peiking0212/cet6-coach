import type { VocabWord } from '@/data/types'

/** Shared memory-aid sections for flashcards, explanations, etc. */
export function VocabMemoryAids({
  word,
  compact = false,
}: {
  word: VocabWord
  /** Smaller spacing for inline reveal panels */
  compact?: boolean
}) {
  const hasRoot = Boolean(word.root)
  const hasCollocations = Boolean(word.collocations?.length)
  const hasTip = Boolean(word.memoryTip)
  if (!hasRoot && !hasCollocations && !hasTip) return null

  return (
    <div className={`vocab-memory${compact ? ' compact' : ''}`}>
      {hasRoot && (
        <section className="vm-section">
          <div className="vm-label">词根</div>
          <div className="vm-body">{word.root}</div>
        </section>
      )}
      {hasCollocations && (
        <section className="vm-section">
          <div className="vm-label">词组</div>
          <ul className="vm-collocations">
            {word.collocations!.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      )}
      {hasTip && (
        <section className="vm-section vm-tip">
          <div className="vm-label">记忆技巧</div>
          <div className="vm-body">{word.memoryTip}</div>
        </section>
      )}
    </div>
  )
}
