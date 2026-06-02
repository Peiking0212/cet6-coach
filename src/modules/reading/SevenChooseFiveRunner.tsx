import { useMemo, useState } from 'react'
import type { ReadingSevenFiveItem } from '@/data/types'
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
import { sanitizeSevenFiveItem } from '@/lib/sanitizeReadingItem'

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

export function SevenChooseFiveRunner({
  item,
  onExit,
  batch,
}: {
  item: ReadingSevenFiveItem
  onExit: () => void
  batch?: BatchContext
}) {
  const { state, record, setStars } = useStore()
  const { onCorrect } = useEncourage()
  const clean = useMemo(() => sanitizeSevenFiveItem(item), [item])
  const diff = moduleDifficulty(state, 'reading')
  const segs = useMemo(() => parsePassage(clean.passage), [clean.passage])
  const [picks, setPicks] = useState<(number | null)[]>(() => item.blanks.map(() => null))
  const [active, setActive] = useState(0)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(false)
  const { ms } = useTimer(!done)

  const usedOptions = new Set(picks.filter((p): p is number => p !== null))

  const assignOption = (optIdx: number) => {
    if (checked) return
    const copy = [...picks]
    const at = copy.indexOf(optIdx)
    if (at >= 0) copy[at] = null
    copy[active] = optIdx
    setPicks(copy)
    const nextEmpty = copy.findIndex((p) => p === null)
    if (nextEmpty >= 0) setActive(nextEmpty)
  }

  const clearBlank = (blankIdx: number) => {
    if (checked) return
    const copy = [...picks]
    copy[blankIdx] = null
    setPicks(copy)
    setActive(blankIdx)
  }

  const stars = useMemo(() => {
    const correct = item.blanks.filter((b, i) => picks[i] === b.answer).length
    const r = correct / item.blanks.length
    return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1
  }, [picks, item.blanks])

  const check = () => {
    const wrong: WrongItem[] = []
    let correct = 0
    item.blanks.forEach((b, i) => {
      if (picks[i] === b.answer) {
        correct += 1
        onCorrect(state.combo + correct)
      } else {
        wrong.push({
          key: `reading:${item.id}:sf${i}`,
          module: 'reading',
          refId: item.id,
          refTitle: item.title,
          question: `七选五 第 (${i + 1}) 空`,
          yourAnswer: picks[i] !== null ? clean.options[picks[i] as number] : '（空）',
          correctAnswer: clean.options[b.answer],
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
    const correct = item.blanks.filter((b, i) => picks[i] === b.answer).length
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
            const correct = checked && pick === item.blanks[bi].answer
            const wrong = checked && pick !== item.blanks[bi].answer
            const preview =
              pick !== null
                ? clean.options[pick].slice(0, 28) + (clean.options[pick].length > 28 ? '…' : '')
                : null
            const answerPreview = clean.options[item.blanks[bi].answer]
            return (
              <button
                key={i}
                className={`seven-five-gap${active === bi && !checked ? ' active' : ''}${
                  correct ? ' ok' : ''
                }${wrong ? ' bad' : ''}`}
                onClick={() => (checked ? undefined : pick !== null ? clearBlank(bi) : setActive(bi))}
              >
                <sup>{bi + 1}</sup>
                {checked && wrong
                  ? answerPreview.slice(0, 32) + (answerPreview.length > 32 ? '…' : '')
                  : preview || '____'}
              </button>
            )
          })}
        </div>
      </div>

      {!checked && (
        <div className="seven-five-options">
          {clean.options.map((opt, i) => (
            <button
              key={i}
              className={`seven-five-opt${usedOptions.has(i) ? ' used' : ''}${
                active === i ? '' : ''
              }`}
              disabled={usedOptions.has(i)}
              onClick={() => assignOption(i)}
            >
              <span className="seven-five-letter">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      )}

      {checked && (
        <div className="card cloze-explains">
          {item.blanks.map((b, i) => (
            <div key={i} className={`cloze-explain ${picks[i] === b.answer ? 'ok' : 'bad'}`}>
              <strong>({i + 1})</strong> {clean.options[b.answer]} — {b.explanation}
            </div>
          ))}
          {item.blanks.some((b, i) => picks[i] !== b.answer) && (
            <AiExplain
              wrong={{
                key: `reading:${item.id}:seven-five`,
                module: 'reading',
                refId: item.id,
                refTitle: item.title,
                question: `七选五《${item.title}》整体讲解`,
                yourAnswer: picks
                  .map((p, i) => `(${i + 1})${p !== null ? clean.options[p].slice(0, 40) : '空'}`)
                  .join(' '),
                correctAnswer: item.blanks
                  .map((b, i) => `(${i + 1})${clean.options[b.answer].slice(0, 40)}`)
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
