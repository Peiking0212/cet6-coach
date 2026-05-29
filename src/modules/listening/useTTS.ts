import { useCallback, useEffect, useRef, useState } from 'react'

export interface TTSState {
  supported: boolean
  speaking: boolean
  rate: number
  currentSentence: number
}

export function useTTS(sentences: string[]) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  const [rate, setRate] = useState(0.9)
  const [speaking, setSpeaking] = useState(false)
  const [currentSentence, setCurrentSentence] = useState(-1)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!synth) return
    const pick = () => {
      const voices = synth.getVoices()
      voiceRef.current =
        voices.find((v) => /en[-_]US/i.test(v.lang) && /female|natural|google|samantha/i.test(v.name)) ||
        voices.find((v) => /^en/i.test(v.lang)) ||
        voices[0] ||
        null
    }
    pick()
    synth.addEventListener?.('voiceschanged', pick)
    return () => synth.removeEventListener?.('voiceschanged', pick)
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
      synth.cancel()
      const u = new SpeechSynthesisUtterance(sentences[index])
      u.rate = rate
      u.lang = 'en-US'
      if (voiceRef.current) u.voice = voiceRef.current
      u.onstart = () => {
        setSpeaking(true)
        setCurrentSentence(index)
      }
      u.onend = () => {
        setSpeaking(false)
        onEnd?.()
      }
      synth.speak(u)
    },
    [synth, sentences, rate],
  )

  const playFrom = useCallback(
    (start: number) => {
      if (!synth) return
      cancelledRef.current = false
      const run = (i: number) => {
        if (cancelledRef.current || i >= sentences.length) {
          setSpeaking(false)
          setCurrentSentence(-1)
          return
        }
        speakOne(i, () => {
          if (!cancelledRef.current) run(i + 1)
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
