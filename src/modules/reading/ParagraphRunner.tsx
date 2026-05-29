import { useMemo, useState } from 'react'
import type { ReadingParagraphItem } from '@/data/types'
import type { WrongItem } from '@/engine/types'
import type { BatchContext } from '@/engine/practiceAll'
import { queueExitLabel } from '@/components/ItemQueueShell'
import { useStore } from '@/store/StoreProvider'
import { moduleDifficulty } from '@/store/adaptive'
import { useEncourage } from '@/components/EncourageProvider'
import { useTimer } from '@/engine/useTimer'
import { QuizBar } from '@/components/QuizBar'
import { AiExplain } from '@/components/AiExplain'
import { ResultSummary } from '@/components/ResultSummary'

export function ParagraphRunner({
  item,
  onExit,
  batch,
}: {
  item: ReadingParagraphItem
  onExit: () => void
  batch?: BatchContext
}) {
  const { state, record, setStars } = useStore()
  const { onCorrect } = useEncourage()
  const diff = moduleDifficulty(state, 'reading')
  const labels = useMemo(() => item.paragraphs.map((p) => p.label), [item.paragraphs])
  const [picks, setPicks] = useState<(string | null)[]>(() =>
    item.statements.map(() => null),
  )
  const [active, setActive] = useState(0)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(false)
  const [showPassage, setShowPassage] = useState(true)
  const { ms } = useTimer(!done)

  const stmt = item.statements[active]

  const pickLabel = (label: string) => {
    if (checked) return
    const copy = [...picks]
    copy[active] = label
    setPicks(copy)
    const next = copy.findIndex((p, i) => p === null && i > active)
    const prev = copy.findIndex((p) => p === null)
    if (next >= 0) setActive(next)
    else if (prev >= 0) setActive(prev)
  }

  const stars = useMemo(() => {
    const correct = item.statements.filter((s, i) => picks[i] === s.answer).length
    const r = correct / item.statements.length
    return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1
  }, [picks, item.statements])

  const check = () => {
    const wrong: WrongItem[] = []
    let correct = 0
    item.statements.forEach((s, i) => {
      if (picks[i] === s.answer) {
        correct += 1
        onCorrect(state.combo + correct)
      } else {
        wrong.push({
          key: `reading:${item.id}:${s.id}`,
          module: 'reading',
          refId: item.id,
          refTitle: item.title,
          question: s.text,
          yourAnswer: picks[i] ?? '（空）',
          correctAnswer: s.answer,
          explanation: s.explanation,
        })
      }
    })
    record({
      module: 'reading',
      refId: item.id,
      refTitle: item.title,
      correct,
      total: item.statements.length,
      timeMs: ms,
      wrong,
    })
    setStars('reading', item.id, stars)
    setChecked(true)
  }

  const allFilled = picks.every((p) => p !== null)

  if (done) {
    const correct = item.statements.filter((s, i) => picks[i] === s.answer).length
    return (
      <div className="runner">
        <ResultSummary
          correct={correct}
          total={item.statements.length}
          timeMs={ms}
          stars={stars}
          onExit={onExit}
          exitLabel={queueExitLabel(batch)}
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
        <div className="runner-title">{item.title}</div>
      </div>

      <QuizBar
        index={picks.filter((p) => p !== null).length}
        total={item.statements.length}
        timeMs={ms}
        combo={state.combo}
        difficulty={diff}
      />

      <div className="card passage-card">
        <button className="passage-toggle" onClick={() => setShowPassage((s) => !s)}>
          {showPassage ? '收起段落 ▲' : '展开段落 ▼'}
        </button>
        {showPassage && (
          <div className="paragraph-list">
            {item.paragraphs.map((p) => (
              <div key={p.label} className="paragraph-block">
                <span className="paragraph-label">{p.label}</span>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card q-card">
        <div className="q-stem">
          第 {active + 1} 题 · 匹配段落
        </div>
        <p className="paragraph-stmt">{stmt.text}</p>
        {!checked ? (
          <div className="paragraph-picks">
            {labels.map((label) => (
              <button
                key={label}
                className={`paragraph-pick${picks[active] === label ? ' selected' : ''}`}
                onClick={() => pickLabel(label)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="paragraph-stmt-nav">
            {item.statements.map((s, i) => (
              <button
                key={s.id}
                className={`paragraph-stmt-chip${picks[i] === s.answer ? ' ok' : ' bad'}${
                  active === i ? ' active' : ''
                }`}
                onClick={() => setActive(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {!checked && item.statements.length > 1 && (
        <div className="paragraph-stmt-nav">
          {item.statements.map((s, i) => (
            <button
              key={s.id}
              className={`paragraph-stmt-chip${picks[i] ? ' filled' : ''}${
                active === i ? ' active' : ''
              }`}
              onClick={() => setActive(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {checked && (
        <div className="card cloze-explains">
          <div className={`cloze-explain ${picks[active] === stmt.answer ? 'ok' : 'bad'}`}>
            <strong>第 {active + 1} 题</strong> 答案 {stmt.answer} — {stmt.explanation}
          </div>
          {picks[active] !== stmt.answer && (
            <AiExplain
              wrong={{
                key: `reading:${item.id}:${stmt.id}`,
                module: 'reading',
                refId: item.id,
                refTitle: item.title,
                question: stmt.text,
                yourAnswer: picks[active] ?? '',
                correctAnswer: stmt.answer,
                explanation: stmt.explanation,
              }}
            />
          )}
        </div>
      )}

      {!checked ? (
        <button className="btn btn-primary runner-next" onClick={check} disabled={!allFilled}>
          提交检查
        </button>
      ) : (
        <button className="btn btn-primary runner-next" onClick={() => setDone(true)}>
          查看成绩
        </button>
      )}
    </div>
  )
}
