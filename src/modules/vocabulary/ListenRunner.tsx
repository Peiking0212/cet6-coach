import { useEffect, useMemo, useState } from 'react'
import type { VocabWord } from '@/data/types'
import type { WrongItem } from '@/engine/types'
import { useStore } from '@/store/StoreProvider'
import { useTimer } from '@/engine/useTimer'
import { useSpeaker } from '@/engine/useSpeaker'
import { QuizBar } from '@/components/QuizBar'
import { MCQ } from '@/components/MCQ'
import { ResultSummary } from '@/components/ResultSummary'
import { IconPlay } from '@/app/icons'
import { distractorWords, shuffle, wordWrong } from './vocab'

interface Q {
  word: VocabWord
  options: string[]
  answerIndex: number
}

function buildQuestions(words: VocabWord[], pool: VocabWord[]): Q[] {
  return shuffle(words).map((word) => {
    const opts = shuffle([word.word, ...distractorWords(word, pool, 3)])
    return { word, options: opts, answerIndex: opts.indexOf(word.word) }
  })
}

export function ListenRunner({
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
  const { record, setStars, vocabGrade } = useStore()
  const questions = useMemo(() => buildQuestions(words, pool), [words, pool])
  const speaker = useSpeaker()
  const [qi, setQi] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const { ms } = useTimer(!done)
  const agg = useMemo(() => ({ correct: 0, wrong: [] as WrongItem[] }), [])

  const q = questions[qi]

  useEffect(() => {
    const t = setTimeout(() => speaker.speak(q.word.word), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi])

  const check = () => {
    if (selected === null) return
    const ok = selected === q.answerIndex
    vocabGrade(q.word.id, ok ? 'know' : 'unknown')
    if (ok) agg.correct += 1
    else agg.wrong.push(wordWrong(q.word, q.options[selected]))
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
        refId: deckId,
        refTitle: `听音选词 · ${deckLabel}`,
        level: 'listen',
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
        <div className="runner-title">听音选词 · {deckLabel}</div>
      </div>

      <QuizBar index={qi} total={questions.length} timeMs={ms} combo={0} />

      <div className="card listen-play-card">
        {!speaker.supported && <div className="tts-warn">当前浏览器不支持语音合成，可凭音标作答。</div>}
        <button className="listen-play-btn" onClick={() => speaker.speak(q.word.word)} aria-label="播放发音">
          <IconPlay size={34} />
        </button>
        <div className="listen-hint">点击喇叭重听，选出你听到的单词</div>
        {revealed && <div className="listen-phonetic">{q.word.phonetic}</div>}
      </div>

      <div className="card q-card">
        <MCQ
          options={q.options.map((o, i) =>
            revealed && i === q.answerIndex ? `${o}  —  ${q.word.meaning}` : o,
          )}
          selected={selected}
          answerIndex={q.answerIndex}
          revealed={revealed}
          onSelect={setSelected}
        />
        {revealed && (
          <div className="explanation">
            <div className="explanation-title">{q.word.word} {q.word.phonetic}</div>
            <div className="vocab-eg">{q.word.example}</div>
            <div className="vocab-eg-cn">{q.word.exampleCn}</div>
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
