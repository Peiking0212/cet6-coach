import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getSpeechSynthesis,
  pickEnglishVoice,
  prepareSpeechSynth,
  speakText,
} from '@/lib/speechSynthesis'

export interface TTSState {
  supported: boolean
  voicesLoading: boolean
  speaking: boolean
  rate: number
  currentSentence: number
}

export function useTTS(sentences: string[]) {
  const synth = getSpeechSynthesis()
  const [rate, setRate] = useState(0.9)
  const [speaking, setSpeaking] = useState(false)
  const [currentSentence, setCurrentSentence] = useState(-1)
  const [voicesLoading, setVoicesLoading] = useState(Boolean(synth))
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const cancelledRef = useRef(false)

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
    cancelledRef.current = true
    synth?.cancel()
    setSpeaking(false)
    setCurrentSentence(-1)
  }, [synth])

  const speakOne = useCallback(
    (index: number, onEnd?: () => void) => {
      if (!synth || index < 0 || index >= sentences.length) return
      const text = sentences[index]
      if (!text?.trim()) return

      cancelledRef.current = false
      speakText(synth, text, {
        rate,
        voice: voiceRef.current,
        onStart: () => {
          setSpeaking(true)
          setCurrentSentence(index)
        },
        onEnd: () => {
          setSpeaking(false)
          onEnd?.()
        },
      })
    },
    [synth, sentences, rate],
  )

  const playFrom = useCallback(
    (start: number) => {
      if (!synth) return
      cancelledRef.current = false
      prepareSpeechSynth(synth)

      const run = (i: number) => {
        if (cancelledRef.current || i >= sentences.length) {
          setSpeaking(false)
          setCurrentSentence(-1)
          return
        }
        speakOne(i, () => {
          if (!cancelledRef.current) {
            prepareSpeechSynth(synth)
            run(i + 1)
          }
        })
      }
      run(start)
    },
    [synth, sentences, speakOne],
  )

  const playAll = useCallback(() => playFrom(0), [playFrom])

  useEffect(() => () => synth?.cancel(), [synth])

  return {
    supported: Boolean(synth),
    voicesLoading,
    speaking,
    rate,
    setRate,
    currentSentence,
    playAll,
    playFrom,
    speakOne,
    stop,
  }
}
