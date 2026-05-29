import { useEffect, useMemo, useState } from 'react'
import type { VocabWord } from '@/data/types'
import type { WrongItem } from '@/engine/types'
import { useStore } from '@/store/StoreProvider'
import { useTimer } from '@/engine/useTimer'
import { useSpeaker } from '@/engine/useSpeaker'
import { QuizBar } from '@/components/QuizBar'
import { ResultSummary } from '@/components/ResultSummary'
import { normalizeSpelling, shuffle, wordWrong } from './vocab'
import { IconPlay } from '@/app/icons'

export function SpellingRunner({
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
  const { record, setStars, vocabGrade } = useStore()
  const deck = useMemo(() => shuffle(words), [words])
  const speaker = useSpeaker()
  const [i, setI] = useState(0)
  const [value, setValue] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [correctNow, setCorrectNow] = useState(false)
  const [done, setDone] = useState(false)
  const { ms } = useTimer(!done)
  const agg = useMemo(() => ({ correct: 0, wrong: [] as WrongItem[] }), [])

  const w = deck[i]

  useEffect(() => {
    const t = setTimeout(() => speaker.speak(w.word), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  const check = () => {
    const ok = normalizeSpelling(value) === normalizeSpelling(w.word)
    setCorrectNow(ok)
    vocabGrade(w.id, ok ? 'know' : 'unknown')
    if (ok) agg.correct += 1
    else agg.wrong.push(wordWrong(w, value))
    setRevealed(true)
  }

  const next = () => {
    if (i + 1 < deck.length) {
      setI(i + 1)
      setValue('')
      setRevealed(false)
    } else {
      const total = deck.length
      const ratio = agg.correct / total
      const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1
      record({
        module: 'vocabulary',
        refId: deckId,
        refTitle: `拼写听写 · ${deckLabel}`,
        level: 'spelling',
        correct: agg.correct,
        total,
        timeMs: ms,
        wrong: agg.wrong,
      })
      setStars('vocabulary', deckId, stars)
      speaker.stop()
      setDone(true)
    }
  }

  if (done) {
    const total = deck.length
    const ratio = agg.correct / total
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1
    return (
      <div className="runner">
        <ResultSummary correct={agg.correct} total={total} timeMs={ms} stars={stars} onExit={onExit} />
      </div>
    )
  }

  return (
    <div className="runner">
      <div className="runner-head">
        <button className="btn btn-ghost runner-back" onClick={() => { speaker.stop(); onExit() }}>
          ← 返回
        </button>
        <div className="runner-title">拼写听写 · {deckLabel}</div>
      </div>

      <QuizBar index={i} total={deck.length} timeMs={ms} combo={0} />

      <div className="card q-card spelling-card">
        {!speaker.supported && <div className="tts-warn">当前浏览器不支持语音合成，可参考释义拼写。</div>}
        <button className="btn btn-primary spelling-replay" onClick={() => speaker.speak(w.word)}>
          <IconPlay size={18} /> 重听单词
        </button>
        <div className="spelling-hint">
          <span className="pill">{w.pos}</span> {w.meaning}
        </div>
        <input
          className={`spelling-input${revealed ? (correctNow ? ' ok' : ' bad') : ''}`}
          value={revealed ? w.word : value}
          placeholder="输入听到的单词…"
          disabled={revealed}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (revealed ? next() : check())
          }}
        />
        {revealed && (
          <div className="explanation">
            <div className="explanation-title">
              {correctNow ? '拼写正确 ✓' : `正确拼写：${w.word}`} {w.phonetic}
            </div>
            <div className="vocab-eg">{w.example}</div>
            <div className="vocab-eg-cn">{w.exampleCn}</div>
          </div>
        )}
      </div>

      {!revealed ? (
        <button className="btn btn-primary runner-next" onClick={check} disabled={!value.trim()}>
          确认
        </button>
      ) : (
        <button className="btn btn-primary runner-next" onClick={next}>
          {i + 1 < deck.length ? '下一词' : '查看成绩'}
        </button>
      )}
    </div>
  )
}
