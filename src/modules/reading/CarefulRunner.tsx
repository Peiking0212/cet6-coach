import { useMemo, useState } from 'react'
import type { ReadingCarefulItem } from '@/data/types'
import type { WrongItem } from '@/engine/types'
import type { BatchContext } from '@/engine/practiceAll'
import { queueExitLabel } from '@/components/ItemQueueShell'
import { useStore } from '@/store/StoreProvider'
import { moduleDifficulty } from '@/store/adaptive'
import { useEncourage } from '@/components/EncourageProvider'
import { useTimer } from '@/engine/useTimer'
import { QuizBar } from '@/components/QuizBar'
import { MCQ } from '@/components/MCQ'
import { AiExplain } from '@/components/AiExplain'
import { ResultSummary } from '@/components/ResultSummary'

const LETTERS = ['A', 'B', 'C', 'D']

export function CarefulRunner({
  item,
  onExit,
  batch,
}: {
  item: ReadingCarefulItem
  onExit: () => void
  batch?: BatchContext
}) {
  const { state, record, setStars } = useStore()
  const { onCorrect } = useEncourage()
  const diff = moduleDifficulty(state, 'reading')
  const [qi, setQi] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const { ms } = useTimer(!done)
  const agg = useMemo(() => ({ correct: 0, wrong: [] as WrongItem[] }), [])
  const [showPassage, setShowPassage] = useState(true)

  const q = item.questions[qi]

  const check = () => {
    if (selected === null) return
    const ok = selected === q.answerIndex
    if (ok) {
      agg.correct += 1
      onCorrect(state.combo + agg.correct)
    }
    else {
      agg.wrong.push({
        key: `reading:${item.id}:${q.id}`,
        module: 'reading',
        refId: item.id,
        refTitle: item.title,
        question: q.stem,
        yourAnswer: `${LETTERS[selected]}. ${q.options[selected]}`,
        correctAnswer: `${LETTERS[q.answerIndex]}. ${q.options[q.answerIndex]}`,
        explanation: q.explanation,
      })
    }
    setRevealed(true)
  }

  const next = () => {
    if (qi + 1 < item.questions.length) {
      setQi(qi + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      const total = item.questions.length
      const stars = agg.correct / total >= 0.9 ? 3 : agg.correct / total >= 0.6 ? 2 : 1
      record({
        module: 'reading',
        refId: item.id,
        refTitle: item.title,
        correct: agg.correct,
        total,
        timeMs: ms,
        wrong: agg.wrong,
      })
      setStars('reading', item.id, stars)
      setDone(true)
    }
  }

  if (done) {
    const total = item.questions.length
    const stars = agg.correct / total >= 0.9 ? 3 : agg.correct / total >= 0.6 ? 2 : 1
    return (
      <div className="runner">
        <ResultSummary correct={agg.correct} total={total} timeMs={ms} stars={stars} onExit={onExit} exitLabel={queueExitLabel(batch)} />
      </div>
    )
  }

  return (
    <div className="runner">
      <div className="runner-head">
        <button className="btn btn-ghost runner-back" onClick={onExit}>
          ← 返回
        </button>
        <div className="runner-title">{item.title}</div>
      </div>

      <div className="card passage-card">
        <button className="passage-toggle" onClick={() => setShowPassage((s) => !s)}>
          {showPassage ? '收起原文 ▲' : '展开原文 ▼'}
        </button>
        {showPassage && <div className="passage-text">{item.passage}</div>}
      </div>

      <QuizBar index={qi} total={item.questions.length} timeMs={ms} combo={state.combo} difficulty={diff} />

      <div className="card q-card">
        <div className="q-stem">
          {qi + 1}. {q.stem}
        </div>
        <MCQ
          options={q.options}
          selected={selected}
          answerIndex={q.answerIndex}
          revealed={revealed}
          onSelect={setSelected}
        />
        {revealed && (
          <>
            <div className="explanation">
              <div className="explanation-title">解析</div>
              {q.explanation}
            </div>
            {selected !== q.answerIndex && (
              <AiExplain
                wrong={{
                  key: `reading:${item.id}:${q.id}`,
                  module: 'reading',
                  refId: item.id,
                  refTitle: item.title,
                  question: q.stem,
                  yourAnswer: selected !== null ? q.options[selected] : '',
                  correctAnswer: q.options[q.answerIndex],
                  explanation: q.explanation,
                }}
              />
            )}
          </>
        )}
      </div>

      {!revealed ? (
        <button className="btn btn-primary runner-next" onClick={check} disabled={selected === null}>
          确认
        </button>
      ) : (
        <button className="btn btn-primary runner-next" onClick={next}>
          {qi + 1 < item.questions.length ? '下一题' : '查看成绩'}
        </button>
      )}
    </div>
  )
}
