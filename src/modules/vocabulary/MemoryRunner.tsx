import { useMemo, useState } from 'react'
import type { VocabWord } from '@/data/types'
import { useStore } from '@/store/StoreProvider'
import { useEncourage } from '@/components/EncourageProvider'
import { useTimer, formatTime } from '@/engine/useTimer'
import { ResultSummary } from '@/components/ResultSummary'
import { shuffle, wordWrong } from './vocab'

const PAIRS = 6

type CardFace = 'word' | 'meaning'

interface Card {
  uid: string
  wordId: string
  face: CardFace
  label: string
}

function buildCards(round: VocabWord[]): Card[] {
  const cards: Card[] = []
  for (const w of round) {
    cards.push({
      uid: `${w.id}-w`,
      wordId: w.id,
      face: 'word',
      label: w.word,
    })
    cards.push({
      uid: `${w.id}-m`,
      wordId: w.id,
      face: 'meaning',
      label: w.meaning.length > 28 ? `${w.meaning.slice(0, 26)}…` : w.meaning,
    })
  }
  return shuffle(cards)
}

export function MemoryRunner({
  words,
  deckId,
  deckLabel,
  onExit,
}: {
  words: VocabWord[]
  deckId: string
  deckLabel: string
  onExit: () => void
}) {
  const { record, vocabGrade, setStars } = useStore()
  const { onCorrect } = useEncourage()
  const round = useMemo(() => shuffle(words).slice(0, Math.min(PAIRS, words.length)), [words])
  const [cards] = useState(() => buildCards(round))
  const [flipped, setFlipped] = useState<string[]>([])
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [moves, setMoves] = useState(0)
  const [lock, setLock] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [done, setDone] = useState(false)
  const { ms } = useTimer(!done)

  const starKey = `${deckId}:memory`

  const finish = (m: Set<string>) => {
    const stars =
      mistakes === 0 && moves <= round.length + 2
        ? 3
        : mistakes <= 2 && moves <= round.length + 6
          ? 2
          : 1
    const wrong = round.filter((w) => !m.has(w.id)).map((w) => wordWrong(w, '未完成配对'))
    record({
      module: 'vocabulary',
      refId: starKey,
      refTitle: `翻翻乐 · ${deckLabel}`,
      level: 'memory',
      correct: m.size,
      total: round.length,
      timeMs: ms,
      wrong,
    })
    setStars('vocabulary', starKey, stars)
    setDone(true)
  }

  const flip = (uid: string) => {
    if (lock || done) return
    const card = cards.find((c) => c.uid === uid)
    if (!card || matched.has(card.wordId)) return
    if (flipped.includes(uid)) return

    const next = [...flipped, uid]
    setFlipped(next)
    if (next.length < 2) return

    setMoves((m) => m + 1)
    setLock(true)
    const [a, b] = next.map((id) => cards.find((c) => c.uid === id)!)
    const ok = a.wordId === b.wordId && a.face !== b.face
    window.setTimeout(() => {
      if (ok) {
        const m = new Set(matched)
        m.add(a.wordId)
        setMatched(m)
        vocabGrade(a.wordId, 'know')
        onCorrect(matched.size + 1)
        setFlipped([])
        if (m.size === round.length) finish(m)
      } else {
        setMistakes((n) => n + 1)
        vocabGrade(a.wordId, 'unknown')
        setFlipped([])
      }
      setLock(false)
    }, ok ? 500 : 700)
  }

  if (done) {
    const stars =
      mistakes === 0 && moves <= round.length + 2
        ? 3
        : mistakes <= 2 && moves <= round.length + 6
          ? 2
          : 1
    return (
      <div className="runner">
        <div className="memory-stats card">
          <span>步数 {moves}</span>
          <span>失误 {mistakes}</span>
        </div>
        <ResultSummary
          correct={round.length}
          total={round.length}
          timeMs={ms}
          stars={stars}
          onExit={onExit}
        />
      </div>
    )
  }

  const isOpen = (c: Card) => flipped.includes(c.uid) || matched.has(c.wordId)

  return (
    <div className="runner">
      <div className="runner-head">
        <button className="btn btn-ghost runner-back" onClick={onExit}>
          ← 返回
        </button>
        <div className="runner-title">翻翻乐 · {deckLabel}</div>
      </div>

      <div className="challenge-bar card">
        <div className="challenge-top">
          <span className="challenge-score">
            已配 {matched.size} / {round.length}
          </span>
          <span className="challenge-score">步数 {moves}</span>
          <span className="challenge-time">⏱ {formatTime(ms)}</span>
        </div>
      </div>

      <div className="memory-grid">
        {cards.map((c) => (
          <button
            key={c.uid}
            type="button"
            className={`memory-card${isOpen(c) ? ' open' : ''}${matched.has(c.wordId) ? ' matched' : ''}${c.face === 'meaning' ? ' meaning' : ''}`}
            onClick={() => flip(c.uid)}
            disabled={lock || matched.has(c.wordId)}
          >
            <span className="memory-card-inner">
              {isOpen(c) ? (
                <>
                  <span className="memory-face-tag">{c.face === 'word' ? '词' : '义'}</span>
                  {c.label}
                </>
              ) : (
                '🌸'
              )}
            </span>
          </button>
        ))}
      </div>
      <p className="memory-tip">翻开两张卡，配对「词」与「义」</p>
    </div>
  )
}
