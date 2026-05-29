import { useEffect, useMemo, useRef, useState } from 'react'
import type { VocabWord } from '@/data/types'
import type { WrongItem } from '@/engine/types'
import { useStore } from '@/store/StoreProvider'
import { useSpeaker } from '@/engine/useSpeaker'
import { MCQ } from '@/components/MCQ'
import { ResultSummary } from '@/components/ResultSummary'
import { distractorMeanings, shuffle, wordWrong } from './vocab'
import { IconFlame } from '@/app/icons'

const DURATION = 45 // seconds

interface Q {
  word: VocabWord
  options: string[]
  answerIndex: number
}

function buildQuestions(words: VocabWord[], pool: VocabWord[], n: number): Q[] {
  const base = shuffle(words)
  const list: VocabWord[] = []
  while (list.length < n) list.push(...base)
  return list.slice(0, n).map((word) => {
    const opts = shuffle([word.meaning, ...distractorMeanings(word, pool)])
    return { word, options: opts, answerIndex: opts.indexOf(word.meaning) }
  })
}

export function ChallengeRunner({
  words,
  pool,
  onExit,
}: {
  words: VocabWord[]
  pool: VocabWord[]
  onExit: () => void
}) {
  const { record, vocabGrade } = useStore()
  const questions = useMemo(() => buildQuestions(words, pool, 40), [words, pool])
  const speaker = useSpeaker()
  const [qi, setQi] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [left, setLeft] = useState(DURATION)
  const [done, setDone] = useState(false)
  const agg = useRef({ correct: 0, total: 0, wrong: [] as WrongItem[] })
  const startedAt = useRef(Date.now())

  const finish = () => {
    if (done) return
    record({
      module: 'vocabulary',
      refId: 'vocab-challenge',
      refTitle: '单词闯关挑战',
      level: 'challenge',
      correct: agg.current.correct,
      total: Math.max(1, agg.current.total),
      timeMs: Date.now() - startedAt.current,
      wrong: agg.current.wrong,
    })
    speaker.stop()
    setDone(true)
  }

  useEffect(() => {
    if (done) return
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => window.clearInterval(id)
  }, [done])

  useEffect(() => {
    if (!done && left <= 0) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, done])

  const q = questions[qi]

  const pick = (idx: number) => {
    if (revealed || done) return
    setSelected(idx)
    setRevealed(true)
    const ok = idx === q.answerIndex
    agg.current.total += 1
    vocabGrade(q.word.id, ok ? 'know' : 'unknown')
    if (ok) {
      agg.current.correct += 1
      setCombo((c) => {
        const nc = c + 1
        setBestCombo((b) => Math.max(b, nc))
        return nc
      })
    } else {
      agg.current.wrong.push(wordWrong(q.word, q.options[idx]))
      setCombo(0)
    }
    window.setTimeout(() => {
      if (qi + 1 >= questions.length) {
        finish()
      } else {
        setQi((n) => n + 1)
        setSelected(null)
        setRevealed(false)
      }
    }, ok ? 450 : 900)
  }

  if (done) {
    return (
      <div className="runner">
        <div className="challenge-result">
          最高连击 <strong><IconFlame size={18} /> {bestCombo}</strong>
        </div>
        <ResultSummary
          correct={agg.current.correct}
          total={Math.max(1, agg.current.total)}
          timeMs={Date.now() - startedAt.current}
          stars={agg.current.correct >= 15 ? 3 : agg.current.correct >= 8 ? 2 : 1}
          onExit={onExit}
        />
      </div>
    )
  }

  const pct = (left / DURATION) * 100

  return (
    <div className="runner">
      <div className="runner-head">
        <button className="btn btn-ghost runner-back" onClick={() => { speaker.stop(); finish() }}>
          ← 结束
        </button>
        <div className="runner-title">单词闯关挑战</div>
      </div>

      <div className="challenge-bar card">
        <div className="challenge-top">
          <span className={`challenge-time${left <= 10 ? ' urgent' : ''}`}>⏱ {left}s</span>
          <span className="challenge-score">得分 {agg.current.correct}</span>
          <span className="challenge-combo">
            <IconFlame size={14} /> {combo}
          </span>
        </div>
        <div className="challenge-track">
          <div className={`challenge-fill${left <= 10 ? ' urgent' : ''}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="card q-card">
        <div className="vocab-prompt">
          <div className="vocab-prompt-word">{q.word.word}</div>
          <div className="vocab-prompt-sub">{q.word.phonetic}</div>
          <div className="vocab-prompt-tag">快速选择释义</div>
        </div>
        <MCQ
          options={q.options}
          selected={selected}
          answerIndex={q.answerIndex}
          revealed={revealed}
          onSelect={pick}
        />
      </div>
    </div>
  )
}
