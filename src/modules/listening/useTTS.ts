import { useCallback, useEffect, useRef, useState } from 'react'
import { canUseNativeSpeech, nativeSpeak, nativeStopSpeech } from '@/lib/nativeSpeech'
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
  const useNative = canUseNativeSpeech()
  const synth = useNative ? null : getSpeechSynthesis()
  const [rate, setRate] = useState(0.9)
  const [speaking, setSpeaking] = useState(false)
  const [currentSentence, setCurrentSentence] = useState(-1)
  const [voicesLoading, setVoicesLoading] = useState(!useNative && Boolean(synth))
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const cancelledRef = useRef(false)
  const nativeRunRef = useRef(0)

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
    nativeRunRef.current += 1
    if (useNative) {
      void nativeStopSpeech()
    } else {
      synth?.cancel()
    }
    setSpeaking(false)
    setCurrentSentence(-1)
  }, [synth, useNative])

  const speakOne = useCallback(
    (index: number, onEnd?: () => void) => {
      if (index < 0 || index >= sentences.length) return
      const text = sentences[index]
      if (!text?.trim()) return

      cancelledRef.current = false

      if (useNative) {
        const runId = ++nativeRunRef.current
        setSpeaking(true)
        setCurrentSentence(index)
        void nativeSpeak(text, { rate })
          .then(() => {
            if (cancelledRef.current || nativeRunRef.current !== runId) return
            setSpeaking(false)
            setCurrentSentence(-1)
            onEnd?.()
          })
          .catch(() => {
            if (nativeRunRef.current !== runId) return
            setSpeaking(false)
            setCurrentSentence(-1)
            onEnd?.()
          })
        return
      }

      if (!synth) return
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
    [synth, sentences, rate, useNative],
  )

  const playFrom = useCallback(
    (start: number) => {
      cancelledRef.current = false

      if (useNative) {
        const runId = ++nativeRunRef.current
        setSpeaking(true)

        const run = async (i: number) => {
          if (cancelledRef.current || nativeRunRef.current !== runId) {
            setSpeaking(false)
            setCurrentSentence(-1)
            return
          }
          if (i >= sentences.length) {
            setSpeaking(false)
            setCurrentSentence(-1)
            return
          }
          const text = sentences[i]
          if (!text?.trim()) {
            await run(i + 1)
            return
          }
          setCurrentSentence(i)
          try {
            await nativeSpeak(text, { rate })
          } catch {
            /* continue */
          }
          await run(i + 1)
        }

        void run(start)
        return
      }

      if (!synth) return
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
    [synth, sentences, speakOne, useNative, rate],
  )

  const playAll = useCallback(() => playFrom(0), [playFrom])

  useEffect(() => () => {
    if (useNative) void nativeStopSpeech()
    else synth?.cancel()
  }, [synth, useNative])

  return {
    supported: useNative || Boolean(synth),
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
