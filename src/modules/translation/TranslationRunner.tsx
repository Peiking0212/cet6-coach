import { useMemo, useState } from 'react'
import type { TranslationItem } from '@/data/types'
import type { AttemptResult, WrongItem } from '@/engine/types'
import type { BatchContext } from '@/engine/practiceAll'
import { batchExitLabel } from '@/engine/practiceAll'
import { useStore } from '@/store/StoreProvider'
import { useTimer } from '@/engine/useTimer'
import { QuizBar } from '@/components/QuizBar'
import { buildBlanks, keywordCoverage, normalize } from './blanks'

type Phase = 'words' | 'sentence' | 'full' | 'done'

const PHASE_LABEL: Record<Exclude<Phase, 'done'>, string> = {
  words: '第一关 · 重点词填空',
  sentence: '第二关 · 整句翻译',
  full: '第三关 · 全文翻译',
}

export function TranslationRunner({
  item,
  onExit,
  batch,
}: {
  item: TranslationItem
  onExit: () => void
  batch?: BatchContext
}) {
  const { state, record, setStars } = useStore()
  const [phase, setPhase] = useState<Phase>('words')
  const { ms, reset } = useTimer(phase !== 'done')

  return (
    <div className="runner">
      <div className="runner-head">
        <button className="btn btn-ghost runner-back" onClick={onExit}>
          ← 返回
        </button>
        <div className="runner-title">{item.title}</div>
        {phase !== 'done' && <span className="pill">{PHASE_LABEL[phase]}</span>}
      </div>

      {phase === 'words' && (
        <WordsLevel
          item={item}
          timeMs={ms}
          combo={state.combo}
          onDone={(res, stars) => {
            record(res)
            setStars('translation', item.id, stars)
            reset()
            setPhase('sentence')
          }}
        />
      )}

      {phase === 'sentence' && (
        <SentenceLevel
          item={item}
          timeMs={ms}
          combo={state.combo}
          onDone={(res) => {
            record(res)
            reset()
            setPhase('full')
          }}
        />
      )}

      {phase === 'full' && (
        <FullLevel
          item={item}
          onDone={(res) => {
            record(res)
            setPhase('done')
          }}
        />
      )}

      {phase === 'done' && (
        <div className="done-card card fade-in">
          <div className="done-emoji">🏆</div>
          <h2>三关通关！</h2>
          <p>《{item.title}》全部完成，继续保持～</p>
          <button className="btn btn-primary" onClick={onExit}>
            {batchExitLabel(batch)}
          </button>
        </div>
      )}
    </div>
  )
}

function starsFor(correct: number, total: number): number {
  if (total === 0) return 1
  const r = correct / total
  if (r >= 0.9) return 3
  if (r >= 0.7) return 2
  return 1
}

function WordsLevel({
  item,
  timeMs,
  combo,
  onDone,
}: {
  item: TranslationItem
  timeMs: number
  combo: number
  onDone: (res: AttemptResult, stars: number) => void
}) {
  const [si, setSi] = useState(0)
  const sentence = item.sentences[si]
  const parts = useMemo(() => buildBlanks(sentence), [sentence])
  const blanks = parts.filter((p) => p.type === 'blank') as Extract<
    ReturnType<typeof buildBlanks>[number],
    { type: 'blank' }
  >[]
  const [inputs, setInputs] = useState<string[]>(() => blanks.map(() => ''))
  const [checked, setChecked] = useState(false)
  const agg = useMemo(() => ({ correct: 0, total: 0, wrong: [] as WrongItem[] }), [])

  const submit = () => {
    if (checked) {
      // advance
      if (si + 1 < item.sentences.length) {
        setSi(si + 1)
        setInputs([])
        setChecked(false)
      } else {
        onDone(
          {
            module: 'translation',
            refId: item.id,
            refTitle: item.title,
            level: 'words',
            correct: agg.correct,
            total: agg.total,
            timeMs,
            wrong: agg.wrong,
          },
          starsFor(agg.correct, agg.total),
        )
      }
      return
    }
    blanks.forEach((b, i) => {
      agg.total += 1
      const ok = normalize(inputs[i] ?? '') === normalize(b.answer)
      if (ok) agg.correct += 1
      else {
        agg.wrong.push({
          key: `translation:${item.id}:w-${si}-${i}`,
          module: 'translation',
          refId: item.id,
          refTitle: item.title,
          question: `填空（${b.hint ?? '关键词'}）：${sentence.cn}`,
          yourAnswer: inputs[i] || '（空）',
          correctAnswer: b.answer,
          explanation: `本句参考：${sentence.en}`,
        })
      }
    })
    setChecked(true)
  }

  let bi = -1
  return (
    <div className="fade-in">
      <QuizBar index={si} total={item.sentences.length} timeMs={timeMs} combo={combo} />
      <div className="card trans-card">
        <div className="trans-cn">{sentence.cn}</div>
        <div className="trans-blank-line">
          {parts.map((p, idx) => {
            if (p.type === 'text') return <span key={idx}>{p.value}</span>
            bi += 1
            const myIndex = bi
            const ok = checked && normalize(inputs[myIndex] ?? '') === normalize(p.answer)
            const bad = checked && !ok
            return (
              <input
                key={idx}
                className={`blank-input${ok ? ' ok' : ''}${bad ? ' bad' : ''}`}
                value={checked ? (ok ? inputs[myIndex] : p.answer) : inputs[myIndex] ?? ''}
                placeholder={p.hint}
                disabled={checked}
                onChange={(e) => {
                  const copy = [...inputs]
                  copy[myIndex] = e.target.value
                  setInputs(copy)
                }}
                size={Math.max(p.answer.length, 6)}
              />
            )
          })}
        </div>
        {checked && (
          <div className="explanation">
            <div className="explanation-title">参考译文</div>
            {sentence.en}
          </div>
        )}
      </div>
      <button className="btn btn-primary runner-next" onClick={submit}>
        {checked ? (si + 1 < item.sentences.length ? '下一句' : '完成本关 →') : '检查'}
      </button>
    </div>
  )
}

function SentenceLevel({
  item,
  timeMs,
  combo,
  onDone,
}: {
  item: TranslationItem
  timeMs: number
  combo: number
  onDone: (res: AttemptResult) => void
}) {
  const [si, setSi] = useState(0)
  const sentence = item.sentences[si]
  const [text, setText] = useState('')
  const [revealed, setRevealed] = useState(false)
  const agg = useMemo(() => ({ correct: 0, total: 0, wrong: [] as WrongItem[] }), [])

  const coverage = revealed ? keywordCoverage(text, sentence) : 0

  const next = (selfCorrect: boolean) => {
    agg.total += 1
    if (selfCorrect) agg.correct += 1
    else {
      agg.wrong.push({
        key: `translation:${item.id}:s-${si}`,
        module: 'translation',
        refId: item.id,
        refTitle: item.title,
        question: `整句翻译：${sentence.cn}`,
        yourAnswer: text || '（空）',
        correctAnswer: sentence.en,
      })
    }
    if (si + 1 < item.sentences.length) {
      setSi(si + 1)
      setText('')
      setRevealed(false)
    } else {
      onDone({
        module: 'translation',
        refId: item.id,
        refTitle: item.title,
        level: 'sentence',
        correct: agg.correct,
        total: agg.total,
        timeMs,
        wrong: agg.wrong,
        selfGraded: true,
      })
    }
  }

  return (
    <div className="fade-in">
      <QuizBar index={si} total={item.sentences.length} timeMs={timeMs} combo={combo} />
      <div className="card trans-card">
        <div className="trans-cn big">{sentence.cn}</div>
        <textarea
          className="trans-textarea"
          value={text}
          placeholder="在此输入英文翻译…"
          disabled={revealed}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        {revealed && (
          <>
            <div className="explanation">
              <div className="explanation-title">参考译文（关键词命中 {Math.round(coverage * 100)}%）</div>
              {sentence.en}
            </div>
            <div className="trans-keywords">
              {sentence.keyWords.map((k) => (
                <span
                  key={k.word}
                  className={`kw${normalize(text).includes(normalize(k.word)) ? ' hit' : ''}`}
                >
                  {k.word}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
      {!revealed ? (
        <button className="btn btn-primary runner-next" onClick={() => setRevealed(true)}>
          查看参考译文
        </button>
      ) : (
        <div className="self-grade">
          <span>自评：我翻得</span>
          <button className="btn" onClick={() => next(false)}>
            还差点
          </button>
          <button className="btn btn-primary" onClick={() => next(true)}>
            基本到位 ✓
          </button>
        </div>
      )}
    </div>
  )
}

function FullLevel({ item, onDone }: { item: TranslationItem; onDone: (res: AttemptResult) => void }) {
  const [text, setText] = useState('')
  const [revealed, setRevealed] = useState(false)
  const { ms } = useTimer(!revealed)

  const finish = (selfCorrect: boolean) => {
    onDone({
      module: 'translation',
      refId: item.id,
      refTitle: item.title,
      level: 'full',
      correct: selfCorrect ? 1 : 0,
      total: 1,
      timeMs: ms,
      wrong: selfCorrect
        ? []
        : [
            {
              key: `translation:${item.id}:full`,
              module: 'translation',
              refId: item.id,
              refTitle: item.title,
              question: `全文翻译：${item.title}`,
              yourAnswer: text.slice(0, 120) || '（空）',
              correctAnswer: item.en,
            },
          ],
      selfGraded: true,
    })
  }

  return (
    <div className="fade-in">
      <div className="card trans-card">
        <div className="trans-cn">{item.cn}</div>
        <textarea
          className="trans-textarea"
          value={text}
          placeholder="尝试翻译整段文字…"
          disabled={revealed}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />
        {revealed && (
          <div className="explanation">
            <div className="explanation-title">参考全文译文</div>
            {item.en}
            {item.notes && <div className="trans-notes">提示：{item.notes}</div>}
          </div>
        )}
      </div>
      {!revealed ? (
        <button className="btn btn-primary runner-next" onClick={() => setRevealed(true)}>
          查看参考译文
        </button>
      ) : (
        <div className="self-grade">
          <span>自评：</span>
          <button className="btn" onClick={() => finish(false)}>
            需要再练
          </button>
          <button className="btn btn-primary" onClick={() => finish(true)}>
            完成通关 ✓
          </button>
        </div>
      )}
    </div>
  )
}
