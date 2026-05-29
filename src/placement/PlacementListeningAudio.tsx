import { useMemo } from 'react'
import { IconPlay } from '@/app/icons'
import { useExamAudio } from '@/modules/listening/useExamAudio'
import { useTTS } from '@/modules/listening/useTTS'

const RATES = [0.8, 0.9, 1, 1.2]

export function PlacementListeningAudio({
  audioUrl,
  sentences = [],
  transcript,
  revealed,
  title,
}: {
  audioUrl?: string
  sentences?: string[]
  transcript?: string
  revealed: boolean
  title?: string
}) {
  const ttsSentences = useMemo(() => {
    if (sentences.length > 0) return sentences
    if (transcript?.trim()) return [transcript]
    return []
  }, [sentences, transcript])

  const hasScript = ttsSentences.length > 0
  const examAudio = useExamAudio(audioUrl)
  const tts = useTTS(hasScript ? ttsSentences : [''])
  const useRealAudio = examAudio.available

  return (
    <div className="card tts-card">
      {title && <div className="runner-title placement-listen-title">{title}</div>}

      {useRealAudio ? (
        <>
          <div className="tts-warn exam-audio-badge">真题录音</div>
          <div className="tts-controls">
            <button
              className="btn btn-primary tts-play"
              onClick={() => (examAudio.playing ? examAudio.stop() : examAudio.play())}
            >
              {examAudio.playing ? '■ 停止' : <><IconPlay size={18} /> 播放音频</>}
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
        </>
      ) : hasScript ? (
        <>
          {!tts.supported && (
            <div className="tts-warn">当前浏览器不支持语音合成，确认后可查看原文。</div>
          )}
          <div className="tts-controls">
            <button
              className="btn btn-primary tts-play"
              onClick={() => (tts.speaking ? tts.stop() : tts.playAll())}
            >
              {tts.speaking ? '■ 停止' : <><IconPlay size={18} /> 播放听力</>}
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
      ) : (
        <div className="tts-warn">暂无听力材料</div>
      )}

      {revealed && hasScript && (
        <div className="passage-text placement-transcript">
          {transcript || ttsSentences.join(' ')}
        </div>
      )}
    </div>
  )
}
