import { useMemo, useState } from 'react'
import type { ReadingWordBankItem } from '@/data/types'
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

export function WordBankRunner({
  item,
  onExit,
  batch,
}: {
  item: ReadingWordBankItem
  onExit: () => void
  batch?: BatchContext
}) {
  const { state, record, setStars } = useStore()
  const { onCorrect } = useEncourage()
  const diff = moduleDifficulty(state, 'reading')
  const segs = useMemo(() => parsePassage(item.passage), [item.passage])
  const [picks, setPicks] = useState<(number | null)[]>(() => item.blanks.map(() => null))
  const [active, setActive] = useState<number>(0)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(false)
  const { ms } = useTimer(!done)

  const usedWords = new Set(picks.filter((p): p is number => p !== null))

  const assignWord = (wordIdx: number) => {
    if (checked) return
    const copy = [...picks]
    const at = copy.indexOf(wordIdx)
    if (at >= 0) copy[at] = null
    copy[active] = wordIdx
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
          key: `reading:${item.id}:b${i}`,
          module: 'reading',
          refId: item.id,
          refTitle: item.title,
          question: `选词填空 第 (${i + 1}) 空`,
          yourAnswer: picks[i] !== null ? item.wordBank[picks[i] as number].word : '（空）',
          correctAnswer: item.wordBank[b.answer].word,
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
            const word = pick !== null ? item.wordBank[pick].word : null
            const correct = checked && pick === item.blanks[bi].answer
            const wrong = checked && pick !== item.blanks[bi].answer
            return (
              <button
                key={i}
                className={`cloze-blank${active === bi && !checked ? ' active' : ''}${
                  correct ? ' ok' : ''
                }${wrong ? ' bad' : ''}`}
                onClick={() => (checked ? undefined : word ? clearBlank(bi) : setActive(bi))}
              >
                <sup>{bi + 1}</sup>
                {checked && wrong ? item.wordBank[item.blanks[bi].answer].word : word || '____'}
              </button>
            )
          })}
        </div>
      </div>

      {!checked && (
        <div className="word-bank">
          {item.wordBank.map((w, i) => (
            <button
              key={i}
              className={`bank-word${usedWords.has(i) ? ' used' : ''}`}
              disabled={usedWords.has(i)}
              onClick={() => assignWord(i)}
            >
              {w.word}
              <span className="pos">{w.pos}</span>
            </button>
          ))}
        </div>
      )}

      {checked && (
        <div className="card cloze-explains">
          {item.blanks.map((b, i) => (
            <div key={i} className={`cloze-explain ${picks[i] === b.answer ? 'ok' : 'bad'}`}>
              <strong>({i + 1})</strong> {item.wordBank[b.answer].word} — {b.explanation}
            </div>
          ))}
          {item.blanks.some((b, i) => picks[i] !== b.answer) && (
            <AiExplain
              wrong={{
                key: `reading:${item.id}:word-bank`,
                module: 'reading',
                refId: item.id,
                refTitle: item.title,
                question: `选词填空《${item.title}》整体讲解`,
                yourAnswer: picks
                  .map((p, i) => `(${i + 1})${p !== null ? item.wordBank[p].word : '空'}`)
                  .join(' '),
                correctAnswer: item.blanks
                  .map((b, i) => `(${i + 1})${item.wordBank[b.answer].word}`)
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

/** @deprecated use WordBankRunner */
export const ClozeRunner = WordBankRunner
