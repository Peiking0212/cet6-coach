import { useMemo, useState } from 'react'
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
  const [showTranscript, setShowTranscript] = useState(false)

  const ttsSentences = useMemo(() => {
    if (sentences.length > 0) return sentences
    if (transcript?.trim()) return [transcript]
    return []
  }, [sentences, transcript])

  const hasScript = ttsSentences.length > 0
  const examAudio = useExamAudio(audioUrl)
  const tts = useTTS(hasScript ? ttsSentences : [''])
  const useRealAudio = examAudio.available
  const examAudioLoading = Boolean(audioUrl?.trim()) && examAudio.loading
  const examAudioMissing = Boolean(audioUrl?.trim()) && examAudio.loadFailed
  const transcriptVisible = showTranscript || revealed

  return (
    <div className="card tts-card">
      {title && <div className="runner-title placement-listen-title">{title}</div>}

      {examAudioLoading ? <div className="tts-hint">真题录音加载中…</div> : null}
      {examAudioMissing ? (
        <div className="tts-warn">未找到录音文件，请重新打包 APK 并确认已导入 MP3。</div>
      ) : null}

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
          {!tts.supported ? (
            <div className="tts-warn">无法朗读，请查看原文作答。</div>
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

      {hasScript && (
        <button className="passage-toggle" onClick={() => setShowTranscript((v) => !v)}>
          {transcriptVisible ? '隐藏原文 ▲' : '查看原文 ▼'}
        </button>
      )}

      {transcriptVisible && hasScript && (
        <div className="passage-text placement-transcript">
          {transcript || ttsSentences.join(' ')}
        </div>
      )}
    </div>
  )
}
