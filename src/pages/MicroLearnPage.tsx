import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/StoreProvider'
import { moduleInsights, pickVocabNearDifficulty, moduleDifficulty } from '@/store/adaptive'
import { vocabularyBank, translationBank, listeningBank, readingBank } from '@/data'
import { MODULE_LABELS } from '@/data/types'
import { shuffle, distractorMeanings } from '@/modules/vocabulary/vocab'
import { MCQ } from '@/components/MCQ'
import { QuizBar } from '@/components/QuizBar'
import { useEncourage } from '@/components/EncourageProvider'
import { useTimer, formatTime } from '@/engine/useTimer'
import { PageHeader } from '@/components/PageHeader'

const DURATION_MS = 3 * 60 * 1000

interface MicroTask {
  id: string
  tag: string
  prompt: string
  sub?: string
  options: string[]
  answerIndex: number
}

function buildMicroTasks(state: ReturnType<typeof useStore>['state']): MicroTask[] {
  const weak = [...moduleInsights(state)].sort((a, b) => b.weakness - a.weakness).slice(0, 3)
  const tasks: MicroTask[] = []

  for (const ins of weak) {
    if (ins.module === 'vocabulary') {
      const words = pickVocabNearDifficulty(
        vocabularyBank.slice(0, 100),
        moduleDifficulty(state, 'vocabulary'),
        2,
      )
      for (const w of words) {
        const opts = shuffle([w.meaning, ...distractorMeanings(w, vocabularyBank.slice(0, 60))])
        tasks.push({
          id: `micro-v-${w.id}`,
          tag: MODULE_LABELS.vocabulary,
          prompt: w.word,
          sub: w.phonetic,
          options: opts,
          answerIndex: opts.indexOf(w.meaning),
        })
      }
    } else if (ins.module === 'listening') {
      const item = listeningBank[0]
      const q = item.questions[0]
      const opts = shuffle([...q.options])
      tasks.push({
        id: `micro-l-${q.id}`,
        tag: MODULE_LABELS.listening,
        prompt: q.stem,
        options: opts,
        answerIndex: opts.indexOf(q.options[q.answerIndex]),
      })
    } else if (ins.module === 'translation') {
      const item = translationBank[0]
      const kw = item.sentences[0].keyWords[0]
      const opts = shuffle([kw.word, 'digital economy', 'heritage', 'innovation'])
      tasks.push({
        id: 'micro-tr',
        tag: MODULE_LABELS.translation,
        prompt: `关键词：${kw.hint ?? '节气'}`,
        sub: '选出对应英文',
        options: opts,
        answerIndex: opts.indexOf(kw.word),
      })
    } else if (ins.module === 'reading') {
      const item = readingBank.find((r) => r.kind === 'careful')!
      const q = item.questions[0]
      const opts = shuffle([...q.options])
      tasks.push({
        id: `micro-r-${q.id}`,
        tag: MODULE_LABELS.reading,
        prompt: q.stem.slice(0, 80) + (q.stem.length > 80 ? '…' : ''),
        options: opts,
        answerIndex: opts.indexOf(q.options[q.answerIndex]),
      })
    }
  }

  return shuffle(tasks).slice(0, 7)
}

export function MicroLearnPage() {
  const { state, record } = useStore()
  const nav = useNavigate()
  const { onCorrect } = useEncourage()
  const tasks = useMemo(() => buildMicroTasks(state), [state])
  const [qi, setQi] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)
  const { ms } = useTimer(!done)
  const timeUp = ms >= DURATION_MS

  useEffect(() => {
    if (timeUp && !done) finish(qi + (revealed ? 1 : 0), correct)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp, done])

  const q = tasks[qi]
  const remain = Math.max(0, DURATION_MS - ms)

  const check = () => {
    if (selected === null) return
    const ok = selected === q.answerIndex
    if (ok) {
      setCorrect((c) => c + 1)
      onCorrect(state.combo + correct + 1)
    }
    setRevealed(true)
  }

  const finish = (answered: number, ok: number) => {
    setDone(true)
    const mod = moduleInsights(state).sort((a, b) => b.weakness - a.weakness)[0].module
    record({
      module: mod,
      refId: 'micro-learn',
      refTitle: '3分钟微学习',
      correct: ok,
      total: answered,
      timeMs: ms,
      wrong: [],
    })
  }

  const next = () => {
    const answered = qi + 1
    const ok = correct
    if (qi + 1 < tasks.length && ms < DURATION_MS) {
      setQi(qi + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      finish(answered, ok)
    }
  }

  if (done) {
    return (
      <div>
        <PageHeader title="微学习完成" subtitle="短时高频，抗枯燥神器" />
        <div className="done-card card fade-in">
          <div className="done-emoji">⚡</div>
          <h2>本轮结束</h2>
          <p>
            完成 {Math.min(qi + 1, tasks.length)} 题，答对 {correct} 题 · 用时 {formatTime(ms)}
          </p>
          <button className="btn btn-primary" onClick={() => nav('/')}>
            回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="micro-learn">
      <PageHeader
        title="3 分钟微学习"
        subtitle={`剩余 ${formatTime(remain)} · 薄弱点混合练习`}
      />
      <QuizBar index={qi} total={tasks.length} timeMs={ms} combo={state.combo} />
      <div className="card q-card">
        <span className="pill">{q.tag}</span>
        <div className="vocab-prompt">
          <div className="vocab-prompt-word">{q.prompt}</div>
          {q.sub && <div className="vocab-prompt-sub">{q.sub}</div>}
        </div>
        <MCQ
          options={q.options}
          selected={selected}
          answerIndex={q.answerIndex}
          revealed={revealed}
          onSelect={setSelected}
        />
      </div>
      {!revealed ? (
        <button className="btn btn-primary runner-next" onClick={check} disabled={selected === null}>
          确认
        </button>
      ) : (
        <button className="btn btn-primary runner-next" onClick={next}>
          下一题
        </button>
      )}
    </div>
  )
}
