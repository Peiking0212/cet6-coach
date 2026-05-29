import { useMemo, useState } from 'react'
import { useStore } from '@/store/StoreProvider'
import { baselineFromPlacement, placementLevelFromScore } from '@/store/defaults'
import { PLACEMENT_LABELS } from '@/store/types'
import { MCQ } from '@/components/MCQ'
import { QuizBar } from '@/components/QuizBar'
import { useTimer } from '@/engine/useTimer'
import { buildPlacementQuestions } from './questions'
import { PlacementListeningAudio } from './PlacementListeningAudio'

export function PlacementFlow({ onDone }: { onDone: () => void }) {
  const { completePlacement } = useStore()
  const questions = useMemo(() => buildPlacementQuestions(), [])
  const [qi, setQi] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)
  const { ms } = useTimer(!finished)

  const q = questions[qi]

  const check = () => {
    if (selected === null) return
    if (selected === q.answerIndex) setCorrect((c) => c + 1)
    setRevealed(true)
  }

  const next = () => {
    if (qi + 1 < questions.length) {
      setQi(qi + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      setFinished(true)
    }
  }

  if (finished) {
    const ratio = questions.length > 0 ? correct / questions.length : 0
    const level = placementLevelFromScore(ratio)
    const baselines = baselineFromPlacement(level)
    return (
      <div className="placement-overlay">
        <div className="placement-card card fade-in">
          <div className="placement-done-emoji">🎯</div>
          <h2>摸底完成</h2>
          <p className="placement-score">
            答对 {correct} / {questions.length} 题（{Math.round(ratio * 100)}%）
          </p>
          <div className="placement-tier pill">{PLACEMENT_LABELS[level]}</div>
          <p className="placement-desc">
            已根据你的表现设置各模块起始难度，首页会显示等级徽章，推荐练习也会更贴合你。
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              completePlacement(level, baselines)
              onDone()
            }}
          >
            开始学习
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="placement-overlay">
      <div className="placement-inner">
        <div className="placement-intro card">
          <h2>入门定位测试</h2>
          <p>约 3–5 分钟，混合词汇、阅读、听力、翻译，帮你找到合适的起点。</p>
          <span className="pill">{qi + 1} / {questions.length}</span>
        </div>

        <QuizBar index={qi} total={questions.length} timeMs={ms} combo={0} />

        {q.module === 'reading' && q.passage && (
          <div className="card passage-card">
            {q.sub && <div className="runner-title placement-passage-title">{q.sub}</div>}
            <div className="passage-text">{q.passage}</div>
          </div>
        )}

        {q.module === 'listening' && (
          <PlacementListeningAudio
            key={q.id}
            audioUrl={q.audioUrl}
            sentences={q.sentences}
            transcript={q.transcript}
            revealed={revealed}
            title={q.sub}
          />
        )}

        <div className="card q-card">
          <span className="pill placement-tag">{q.tag}</span>

          {q.module === 'vocabulary' ? (
            <div className="vocab-prompt">
              <div className="vocab-prompt-word">{q.prompt}</div>
              {q.sub && <div className="vocab-prompt-sub">{q.sub}</div>}
            </div>
          ) : (
            <>
              {q.sub && q.module !== 'reading' && q.module !== 'listening' && (
                <div className="vocab-prompt-sub">{q.sub}</div>
              )}
              <div className="q-stem">{q.prompt}</div>
            </>
          )}

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
            {qi + 1 < questions.length ? '下一题' : '查看结果'}
          </button>
        )}
      </div>
    </div>
  )
}
