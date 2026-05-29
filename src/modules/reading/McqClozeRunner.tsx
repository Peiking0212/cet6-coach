import { useMemo, useState } from 'react'
import type { ReadingMcqClozeItem } from '@/data/types'
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

interface Seg {
  text?: string
  blank?: number
}

function parsePassage(passage: string): Seg[] {
  const segs: Seg[] = []
  const re = /\((\d+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(passage))) {
    if (m.index > last) segs.push({ text: passage.slice(last, m.index) })
    segs.push({ blank: Number(m[1]) - 1 })
    last = m.index + m[0].length
  }
  if (last < passage.length) segs.push({ text: passage.slice(last) })
  return segs
}

export function McqClozeRunner({
  item,
  onExit,
  batch,
}: {
  item: ReadingMcqClozeItem
  onExit: () => void
  batch?: BatchContext
}) {
  const { state, record, setStars } = useStore()
  const { onCorrect } = useEncourage()
  const diff = moduleDifficulty(state, 'reading')
  const segs = useMemo(() => parsePassage(item.passage), [item.passage])
  const [picks, setPicks] = useState<(number | null)[]>(() => item.blanks.map(() => null))
  const [active, setActive] = useState(0)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(false)
  const { ms } = useTimer(!done)

  const blank = item.blanks[active]
  const selected = picks[active]

  const setPick = (optIdx: number) => {
    if (checked) return
    const copy = [...picks]
    copy[active] = optIdx
    setPicks(copy)
    const next = copy.findIndex((p, i) => p === null && i > active)
    const prev = copy.findIndex((p) => p === null)
    if (next >= 0) setActive(next)
    else if (prev >= 0) setActive(prev)
  }

  const stars = useMemo(() => {
    const correct = item.blanks.filter((b, i) => picks[i] === b.answerIndex).length
    const r = correct / item.blanks.length
    return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1
  }, [picks, item.blanks])

  const check = () => {
    const wrong: WrongItem[] = []
    let correct = 0
    item.blanks.forEach((b, i) => {
      if (picks[i] === b.answerIndex) {
        correct += 1
        onCorrect(state.combo + correct)
      } else {
        wrong.push({
          key: `reading:${item.id}:mcq${i}`,
          module: 'reading',
          refId: item.id,
          refTitle: item.title,
          question: `完形填空 第 (${i + 1}) 空`,
          yourAnswer:
            picks[i] !== null ? b.options[picks[i] as number] : '（空）',
          correctAnswer: b.options[b.answerIndex],
          explanation: b.explanation,
        })
      }
    })
    record({
      module: 'reading',
      refId: item.id,
      refTitle: item.title,
      correct,
      total: item.blanks.length,
      timeMs: ms,
      wrong,
    })
    setStars('reading', item.id, stars)
    setChecked(true)
  }

  const allFilled = picks.every((p) => p !== null)

  if (done) {
    const correct = item.blanks.filter((b, i) => picks[i] === b.answerIndex).length
    return (
      <div className="runner">
        <ResultSummary
          correct={correct}
          total={item.blanks.length}
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
        total={item.blanks.length}
        timeMs={ms}
        combo={state.combo}
        difficulty={diff}
      />

      <div className="card passage-card">
        <div className="cloze-passage">
          {segs.map((s, i) => {
            if (s.text !== undefined) return <span key={i}>{s.text}</span>
            const bi = s.blank as number
            const pick = picks[bi]
            const correct = checked && pick === item.blanks[bi].answerIndex
            const wrong = checked && pick !== item.blanks[bi].answerIndex
            const display =
              checked && wrong
                ? item.blanks[bi].options[item.blanks[bi].answerIndex]
                : pick !== null
                  ? item.blanks[bi].options[pick]
                  : null
            return (
              <button
                key={i}
                className={`cloze-blank mcq-cloze-blank${active === bi && !checked ? ' active' : ''}${
                  correct ? ' ok' : ''
                }${wrong ? ' bad' : ''}`}
                onClick={() => !checked && setActive(bi)}
              >
                <sup>{bi + 1}</sup>
                {display ? (display.length > 20 ? display.slice(0, 20) + '…' : display) : '____'}
              </button>
            )
          })}
        </div>
      </div>

      {!checked && (
        <div className="card q-card">
          <div className="q-stem">第 ({active + 1}) 空 — 选择最佳答案</div>
          <MCQ
            options={blank.options}
            selected={selected}
            answerIndex={blank.answerIndex}
            revealed={false}
            onSelect={setPick}
          />
        </div>
      )}

      {checked && (
        <div className="card cloze-explains">
          {item.blanks.map((b, i) => (
            <div key={i} className={`cloze-explain ${picks[i] === b.answerIndex ? 'ok' : 'bad'}`}>
              <strong>({i + 1})</strong> {b.options[b.answerIndex]} — {b.explanation}
            </div>
          ))}
          {item.blanks.some((b, i) => picks[i] !== b.answerIndex) && (
            <AiExplain
              wrong={{
                key: `reading:${item.id}:mcq-cloze`,
                module: 'reading',
                refId: item.id,
                refTitle: item.title,
                question: `完形填空《${item.title}》整体讲解`,
                yourAnswer: picks
                  .map((p, i) =>
                    `(${i + 1})${p !== null ? item.blanks[i].options[p] : '空'}`,
                  )
                  .join(' '),
                correctAnswer: item.blanks
                  .map((b, i) => `(${i + 1})${b.options[b.answerIndex]}`)
                  .join(' '),
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
