import { useMemo, useState } from 'react'
import type { VocabWord } from '@/data/types'
import { useStore } from '@/store/StoreProvider'
import { useTimer, formatTime } from '@/engine/useTimer'
import { ResultSummary } from '@/components/ResultSummary'
import { IconFlame } from '@/app/icons'
import { shuffle, wordWrong } from './vocab'

const PAIRS = 6

export function MatchRunner({
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
  const round = useMemo(() => shuffle(words).slice(0, Math.min(PAIRS, words.length)), [words])
  const leftItems = useMemo(() => shuffle(round), [round])
  const rightItems = useMemo(() => shuffle(round), [round])

  const [selLeft, setSelLeft] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrongId, setWrongId] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [combo, setCombo] = useState(0)
  const [done, setDone] = useState(false)
  const { ms } = useTimer(!done)

  const finishGame = (m: Set<string>) => {
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
    const wrong = round.filter((w) => !m.has(w.id)).map((w) => wordWrong(w, '未配对'))
    record({
      module: 'vocabulary',
      refId: deckId,
      refTitle: `词义速配 · ${deckLabel}`,
      level: 'match',
      correct: m.size,
      total: round.length,
      timeMs: ms,
      wrong,
    })
    setStars('vocabulary', deckId, stars)
    setDone(true)
  }

  const tryMatch = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      const m = new Set(matched)
      m.add(leftId)
      setMatched(m)
      vocabGrade(leftId, 'know')
      setCombo((c) => c + 1)
      setSelLeft(null)
      if (m.size === round.length) finishGame(m)
    } else {
      setMistakes((n) => n + 1)
      setCombo(0)
      vocabGrade(leftId, 'unknown')
      setWrongId(rightId)
      setTimeout(() => {
        setWrongId(null)
        setSelLeft(null)
      }, 450)
    }
  }

  const clickLeft = (id: string) => {
    if (matched.has(id) || done) return
    setSelLeft(id)
  }
  const clickRight = (id: string) => {
    if (matched.has(id) || done || !selLeft) return
    tryMatch(selLeft, id)
  }

  if (done) {
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
    return (
      <div className="runner">
        <ResultSummary correct={round.length} total={round.length} timeMs={ms} stars={stars} onExit={onExit} />
      </div>
    )
  }

  return (
    <div className="runner">
      <div className="runner-head">
        <button className="btn btn-ghost runner-back" onClick={onExit}>
          ← 返回
        </button>
        <div className="runner-title">词义速配 · {deckLabel}</div>
      </div>

      <div className="challenge-bar card">
        <div className="challenge-top">
          <span className="challenge-score">已配 {matched.size} / {round.length}</span>
          <span className="challenge-combo">
            <IconFlame size={14} /> {combo}
          </span>
          <span className="challenge-time">⏱ {formatTime(ms)}</span>
        </div>
      </div>

      <div className="match-grid">
        <div className="match-col">
          {leftItems.map((w) => (
            <button
              key={w.id}
              className={`match-cell word${matched.has(w.id) ? ' matched' : ''}${selLeft === w.id ? ' sel' : ''}`}
              onClick={() => clickLeft(w.id)}
              disabled={matched.has(w.id)}
            >
              {w.word}
            </button>
          ))}
        </div>
        <div className="match-col">
          {rightItems.map((w) => (
            <button
              key={w.id}
              className={`match-cell meaning${matched.has(w.id) ? ' matched' : ''}${wrongId === w.id ? ' bad' : ''}`}
              onClick={() => clickRight(w.id)}
              disabled={matched.has(w.id)}
            >
              {w.meaning}
            </button>
          ))}
        </div>
      </div>
      <div className="match-tip">先点左侧单词，再点右侧对应释义</div>
    </div>
  )
}
