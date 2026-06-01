import { useMemo, useState } from 'react'
import type { ListeningItem } from '@/data/types'
import type { WrongItem } from '@/engine/types'
import type { BatchContext } from '@/engine/practiceAll'
import { queueExitLabel } from '@/components/ItemQueueShell'
import { useStore } from '@/store/StoreProvider'
import { moduleDifficulty } from '@/store/adaptive'
import { useEncourage } from '@/components/EncourageProvider'
import { useTimer } from '@/engine/useTimer'
import { useTTS } from './useTTS'
import { useExamAudio } from './useExamAudio'
import { QuizBar } from '@/components/QuizBar'
import { MCQ } from '@/components/MCQ'
import { AiExplain } from '@/components/AiExplain'
import { ResultSummary } from '@/components/ResultSummary'
import { IconPlay } from '@/app/icons'

const LETTERS = ['A', 'B', 'C', 'D']
const RATES = [0.6, 0.8, 0.9, 1, 1.2]

export function ListeningRunner({
  item,
  onExit,
  batch,
}: {
  item: ListeningItem
  onExit: () => void
  batch?: BatchContext
}) {
  const { state, record, setStars } = useStore()
  const { onCorrect } = useEncourage()
  const diff = moduleDifficulty(state, 'listening')
  const hasScript = item.sentences.length > 0
  const examAudio = useExamAudio(item.audioUrl)
  const tts = useTTS(hasScript ? item.sentences : [''])
  const useRealAudio = examAudio.available
  const [stage, setStage] = useState<'listen' | 'quiz'>('listen')
  const [qi, setQi] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const { ms } = useTimer(stage === 'quiz' && !done)
  const agg = useMemo(() => ({ correct: 0, wrong: [] as WrongItem[] }), [])

  const q = item.questions[qi]

  const check = () => {
    if (selected === null) return
    if (selected === q.answerIndex) {
      agg.correct += 1
      onCorrect(state.combo + agg.correct)
    } else {
      agg.wrong.push({
        key: `listening:${item.id}:${q.id}`,
        module: 'listening',
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
        module: 'listening',
        refId: item.id,
        refTitle: item.title,
        correct: agg.correct,
        total,
        timeMs: ms,
        wrong: agg.wrong,
      })
      setStars('listening', item.id, stars)
      tts.stop()
      examAudio.stop()
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
        <button
          className="btn btn-ghost runner-back"
          onClick={() => {
            tts.stop()
            examAudio.stop()
            onExit()
          }}
        >
          ← 返回
        </button>
        <div className="runner-title">{item.title}</div>
      </div>

      <div className="card tts-card">
        {useRealAudio ? (
          <>
            <div className="tts-warn exam-audio-badge">真题录音（本地导入）</div>
            <div className="tts-controls">
              <button
                className="btn btn-primary tts-play"
                onClick={() => (examAudio.playing ? examAudio.stop() : examAudio.play())}
              >
                {examAudio.playing ? '■ 停止' : <><IconPlay size={18} /> 播放真题音频</>}
              </button>
            </div>
            <div className="tts-rate">
              <span>语速</span>
              {RATES.map((r) => (
                <button
                  key={r}
                  className={`rate-btn${examAudio.rate === r ? ' active' : ''}`}
                  onClick={() => examAudio.setRate(r)}
                >
                  {r}×
                </button>
              ))}
            </div>
            {!hasScript && (
              <p className="exam-audio-hint">{item.transcript}</p>
            )}
          </>
        ) : (
          <>
            {!tts.supported ? (
              <div className="tts-warn">浏览器无法朗读，请查看原文作答。</div>
            ) : tts.voicesLoading ? (
              <div className="tts-hint">语音加载中… 可先查看原文，或点此播放</div>
            ) : (
              <div className="tts-hint">点此播放，或查看原文</div>
            )}
            <div className="tts-controls">
              <button
                className="btn btn-primary tts-play"
                onClick={() => (tts.speaking ? tts.stop() : tts.playAll())}
              >
                {tts.speaking ? '■ 停止' : <><IconPlay size={18} /> 通篇朗读</>}
              </button>
            </div>
            <div className="tts-rate">
              <span>语速</span>
              {RATES.map((r) => (
                <button
                  key={r}
                  className={`rate-btn${tts.rate === r ? ' active' : ''}`}
                  onClick={() => tts.setRate(r)}
                >
                  {r}×
                </button>
              ))}
            </div>
          </>
        )}
        {hasScript && (
          <>
            <div className="tts-sentences">
              {item.sentences.map((s, i) => (
                <button
                  key={i}
                  className={`tts-sentence${tts.currentSentence === i ? ' playing' : ''}`}
                  onClick={() => tts.speakOne(i)}
                >
                  <span className="tts-sentence-no">{i + 1}</span>
                  <span className="tts-sentence-text">
                    {showTranscript || stage === 'quiz'
                      ? s
                      : '点击播放本句（听写练习中文本默认隐藏）'}
                  </span>
                </button>
              ))}
            </div>
            <button className="passage-toggle" onClick={() => setShowTranscript((v) => !v)}>
              {showTranscript ? '隐藏原文 ▲' : '显示原文（听写后再看）▼'}
            </button>
          </>
        )}
      </div>

      {stage === 'listen' ? (
        <button
          className="btn btn-primary runner-next"
          onClick={() => {
            tts.stop()
            examAudio.stop()
            setStage('quiz')
          }}
        >
          开始答题 →
        </button>
      ) : (
        <>
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
                      key: `listening:${item.id}:${q.id}`,
                      module: 'listening',
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
        </>
      )}
    </div>
  )
}
