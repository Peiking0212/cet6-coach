import { useMemo, useState } from 'react'
import type { VocabWord } from '@/data/types'
import type { WrongItem } from '@/engine/types'
import { useStore } from '@/store/StoreProvider'
import { moduleDifficulty, pickVocabNearDifficulty } from '@/store/adaptive'
import { useEncourage } from '@/components/EncourageProvider'
import { useTimer } from '@/engine/useTimer'
import { useSpeaker } from '@/engine/useSpeaker'
import { QuizBar } from '@/components/QuizBar'
import { MCQ } from '@/components/MCQ'
import { ResultSummary } from '@/components/ResultSummary'
import { DECK_SIZE, distractorMeanings, distractorWords, shuffle, wordWrong } from './vocab'
import { VocabMemoryAids } from './VocabMemoryAids'
import { IconPlay } from '@/app/icons'

interface Q {
  word: VocabWord
  dir: 'w2m' | 'm2w'
  prompt: string
  sub: string
  options: string[]
  answerIndex: number
}

function buildQuestions(
  words: VocabWord[],
  pool: VocabWord[],
  targetDiff: number,
  practiceAll = false,
): Q[] {
  const picked = practiceAll
    ? shuffle(words)
    : pickVocabNearDifficulty(words, targetDiff, Math.min(words.length, DECK_SIZE))
  return shuffle(picked.length ? picked : words).map((word) => {
    const dir: 'w2m' | 'm2w' = Math.random() < 0.5 ? 'w2m' : 'm2w'
    if (dir === 'w2m') {
      const opts = shuffle([word.meaning, ...distractorMeanings(word, pool)])
      return {
        word,
        dir,
        prompt: word.word,
        sub: word.phonetic,
        options: opts,
        answerIndex: opts.indexOf(word.meaning),
      }
    }
    const opts = shuffle([word.word, ...distractorWords(word, pool)])
    return {
      word,
      dir,
      prompt: word.meaning,
      sub: word.pos,
      options: opts,
      answerIndex: opts.indexOf(word.word),
    }
  })
}

export function ChoiceRunner({
  words,
  pool,
  deckId,
  deckLabel,
  practiceAll = false,
  onExit,
}: {
  words: VocabWord[]
  pool: VocabWord[]
  deckId: string
  deckLabel: string
  practiceAll?: boolean
  onExit: () => void
}) {
  const { state, record, setStars, vocabGrade } = useStore()
  const { onCorrect } = useEncourage()
  const diff = moduleDifficulty(state, 'vocabulary')
  const questions = useMemo(
    () => buildQuestions(words, pool, diff, practiceAll),
    [words, pool, diff, practiceAll],
  )
  const speaker = useSpeaker()
  const [qi, setQi] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const { ms } = useTimer(!done)
  const agg = useMemo(() => ({ correct: 0, wrong: [] as WrongItem[] }), [])

  const q = questions[qi]

  const check = () => {
    if (selected === null) return
    const ok = selected === q.answerIndex
    vocabGrade(q.word.id, ok ? 'know' : 'unknown')
    if (ok) {
      agg.correct += 1
      onCorrect(state.combo + agg.correct)
    } else agg.wrong.push(wordWrong(q.word, q.options[selected]))
    if (q.dir === 'w2m') speaker.speak(q.word.word)
    setRevealed(true)
  }

  const next = () => {
    if (qi + 1 < questions.length) {
      setQi(qi + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      const total = questions.length
      const ratio = agg.correct / total
      const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1
      record({
        module: 'vocabulary',
        refId: practiceAll ? `${deckId}:all` : deckId,
        refTitle: practiceAll ? `全部练习 · ${deckLabel}` : `中英选择 · ${deckLabel}`,
        level: 'choice',
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
    const total = questions.length
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
        <div className="runner-title">中英选择 · {deckLabel}</div>
      </div>

      <QuizBar index={qi} total={questions.length} timeMs={ms} combo={state.combo} difficulty={diff} />

      <div className="card q-card">
        <div className="vocab-prompt">
          <div className="vocab-prompt-word">
            {q.prompt}
            {q.dir === 'w2m' && (
              <button
                className="vocab-prompt-speak"
                onClick={() => speaker.speak(q.word.word)}
                aria-label="朗读"
              >
                <IconPlay size={16} />
              </button>
            )}
          </div>
          <div className="vocab-prompt-sub">{q.sub}</div>
          <div className="vocab-prompt-tag">{q.dir === 'w2m' ? '选择正确释义' : '选择正确单词'}</div>
        </div>
        <MCQ
          options={q.options}
          selected={selected}
          answerIndex={q.answerIndex}
          revealed={revealed}
          onSelect={setSelected}
        />
        {revealed && (
          <div className="explanation">
            <div className="explanation-title">{q.word.word} {q.word.phonetic}</div>
            {q.word.pos} {q.word.meaning}
            <div className="vocab-eg">{q.word.example}</div>
            <div className="vocab-eg-cn">{q.word.exampleCn}</div>
            <VocabMemoryAids word={q.word} compact />
          </div>
        )}
      </div>

      {!revealed ? (
        <button className="btn btn-primary runner-next" onClick={check} disabled={selected === null}>
          确认
        </button>
      ) : (
        <button className="btn btn-primary runner-next" onClick={next}>
          {qi + 1 < questions.length ? '下一题' : '查看成绩'}
        </button>
      )}
    </div>
  )
}
