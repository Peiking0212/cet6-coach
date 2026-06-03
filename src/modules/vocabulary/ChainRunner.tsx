import { useMemo, useRef, useState } from 'react'
import type { VocabWord } from '@/data/types'
import type { WrongItem } from '@/engine/types'
import { useStore } from '@/store/StoreProvider'
import { useEncourage } from '@/components/EncourageProvider'
import { useTimer, formatTime } from '@/engine/useTimer'
import { MCQ } from '@/components/MCQ'
import { ResultSummary } from '@/components/ResultSummary'
import { distractorWords, shuffle, wordWrong } from './vocab'

const CHAIN_LEN = 8

function tailLetter(word: string): string {
  const m = word.replace(/[^a-zA-Z]/g, '')
  return (m.slice(-1) || 'a').toLowerCase()
}

function startsWithLetter(word: VocabWord, letter: string): boolean {
  const m = word.word.replace(/[^a-zA-Z]/g, '')
  return m.toLowerCase().startsWith(letter)
}

function pickNext(
  current: VocabWord,
  pool: VocabWord[],
  used: Set<string>,
): { next: VocabWord; options: string[]; answerIndex: number } | null {
  const letter = tailLetter(current.word)
  const valid = pool.filter((w) => !used.has(w.id) && startsWithLetter(w, letter))
  if (!valid.length) return null
  const next = valid[Math.floor(Math.random() * valid.length)]
  const opts = shuffle([next.word, ...distractorWords(next, pool, 3)])
  return { next, options: opts, answerIndex: opts.indexOf(next.word) }
}

export function ChainRunner({
  words,
  pool,
  deckId,
  deckLabel,
  onExit,
}: {
  words: VocabWord[]
  pool: VocabWord[]
  deckId: string
  deckLabel: string
  onExit: () => void
}) {
  const { record, vocabGrade, setStars } = useStore()
  const { onCorrect } = useEncourage()
  const source = pool.length >= 20 ? pool : words
  const chain = useMemo(() => {
    const used = new Set<string>()
    const steps: {
      from: VocabWord
      letter: string
      options: string[]
      answerIndex: number
      answer: VocabWord
    }[] = []
    let cur = shuffle(words)[0] ?? shuffle(source)[0]
    if (!cur) return steps
    used.add(cur.id)
    for (let i = 0; i < CHAIN_LEN; i++) {
      const pick = pickNext(cur, source, used)
      if (!pick) break
      used.add(pick.next.id)
      steps.push({
        from: cur,
        letter: tailLetter(cur.word),
        options: pick.options,
        answerIndex: pick.answerIndex,
        answer: pick.next,
      })
      cur = pick.next
    }
    return steps
  }, [words, source])

  const [si, setSi] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [streak, setStreak] = useState(0)
  const { ms } = useTimer(!done)
  const agg = useRef({ correct: 0, wrong: [] as WrongItem[] })

  const step = chain[si]
  const starKey = `${deckId}:chain`

  const finish = () => {
    const total = chain.length
    const ratio = total ? agg.current.correct / total : 0
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1
    record({
      module: 'vocabulary',
      refId: starKey,
      refTitle: `单词接龙 · ${deckLabel}`,
      level: 'chain',
      correct: agg.current.correct,
      total: Math.max(1, total),
      timeMs: ms,
      wrong: agg.current.wrong,
    })
    setStars('vocabulary', starKey, stars)
    setDone(true)
  }

  const pick = (idx: number) => {
    if (revealed || done || !step) return
    setSelected(idx)
    setRevealed(true)
    const ok = idx === step.answerIndex
    vocabGrade(step.answer.id, ok ? 'know' : 'unknown')
    if (ok) {
      agg.current.correct += 1
      setStreak((s) => s + 1)
      onCorrect(streak + 1)
    } else {
      agg.current.wrong.push(wordWrong(step.answer, step.options[idx]))
      setStreak(0)
    }
    window.setTimeout(() => {
      if (si + 1 >= chain.length) finish()
      else {
        setSi(si + 1)
        setSelected(null)
        setRevealed(false)
      }
    }, ok ? 400 : 800)
  }

  if (!chain.length) {
    return (
      <div className="runner">
        <div className="card">
          <p>当前词库太短或首尾字母接不上，请换更大词库或分组。</p>
          <button className="btn btn-primary" onClick={onExit}>
            返回
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    const stars =
      agg.current.correct >= chain.length
        ? 3
        : agg.current.correct >= Math.ceil(chain.length * 0.6)
          ? 2
          : 1
    return (
      <div className="runner">
        <ResultSummary
          correct={agg.current.correct}
          total={chain.length}
          timeMs={ms}
          stars={stars}
          onExit={onExit}
        />
      </div>
    )
  }

  return (
    <div className="runner">
      <div className="runner-head">
        <button className="btn btn-ghost runner-back" onClick={onExit}>
          ← 返回
        </button>
        <div className="runner-title">单词接龙 · {deckLabel}</div>
      </div>

      <div className="challenge-bar card">
        <div className="challenge-top">
          <span className="challenge-score">
            第 {si + 1} / {chain.length} 环
          </span>
          <span className="challenge-combo">🔥 {streak}</span>
          <span className="challenge-time">⏱ {formatTime(ms)}</span>
        </div>
      </div>

      <div className="chain-trail card">
        {si > 0 && (
          <span className="chain-prev">
            {chain
              .slice(0, si)
              .map((s) => s.from.word)
              .join(' → ')}{' '}
            →
          </span>
        )}
        <strong className="chain-current">{step.from.word}</strong>
      </div>

      <div className="card q-card fade-in">
        <div className="chain-prompt">
          尾字母 <span className="chain-letter">{step.letter.toUpperCase()}</span> 开头，接下一个词：
        </div>
        <MCQ
          options={step.options}
          selected={selected}
          answerIndex={step.answerIndex}
          revealed={revealed}
          onSelect={pick}
        />
        {revealed && (
          <div className="explanation">
            <div className="explanation-title">
              {selected === step.answerIndex ? '✓' : `✗ 应为 ${step.answer.word}`} · {step.answer.meaning}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
