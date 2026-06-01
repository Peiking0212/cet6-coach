import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getSpeechSynthesis,
  pickEnglishVoice,
  prepareSpeechSynth,
  speakText,
} from '@/lib/speechSynthesis'

/**
 * Generic one-shot SpeechSynthesis speaker, reusing the same English-voice
 * selection approach as the listening module's useTTS, but for arbitrary text
 * (single words, example sentences, etc.).
 */
export function useSpeaker() {
  const synth = getSpeechSynthesis()
  const [speaking, setSpeaking] = useState(false)
  const [voicesLoading, setVoicesLoading] = useState(Boolean(synth))
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (!synth) return
    const pick = () => {
      const voices = prepareSpeechSynth(synth)
      voiceRef.current = pickEnglishVoice(voices)
      if (voices.length > 0) setVoicesLoading(false)
    }
    pick()
    synth.addEventListener('voiceschanged', pick)
    const t = window.setTimeout(() => setVoicesLoading(false), 1200)
    return () => {
      window.clearTimeout(t)
      synth.removeEventListener('voiceschanged', pick)
    }
  }, [synth])

  const stop = useCallback(() => {
    synth?.cancel()
    setSpeaking(false)
  }, [synth])

  const speak = useCallback(
    (text: string, rate = 0.9) => {
      if (!synth || !text) return
      speakText(synth, text, {
        rate,
        voice: voiceRef.current,
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
      })
    },
    [synth],
  )

  useEffect(() => () => synth?.cancel(), [synth])

  return { supported: Boolean(synth), voicesLoading, speaking, speak, stop }
}
