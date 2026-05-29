import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Generic one-shot SpeechSynthesis speaker, reusing the same English-voice
 * selection approach as the listening module's useTTS, but for arbitrary text
 * (single words, example sentences, etc.).
 */
export function useSpeaker() {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  const [speaking, setSpeaking] = useState(false)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (!synth) return
    const pick = () => {
      const voices = synth.getVoices()
      voiceRef.current =
        voices.find(
          (v) => /en[-_]US/i.test(v.lang) && /female|natural|google|samantha/i.test(v.name),
        ) ||
        voices.find((v) => /^en/i.test(v.lang)) ||
        voices[0] ||
        null
    }
    pick()
    synth.addEventListener?.('voiceschanged', pick)
    return () => synth.removeEventListener?.('voiceschanged', pick)
  }, [synth])

  const stop = useCallback(() => {
    synth?.cancel()
    setSpeaking(false)
  }, [synth])

  const speak = useCallback(
    (text: string, rate = 0.9) => {
      if (!synth || !text) return
      synth.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = rate
      u.lang = 'en-US'
      if (voiceRef.current) u.voice = voiceRef.current
      u.onstart = () => setSpeaking(true)
      u.onend = () => setSpeaking(false)
      synth.speak(u)
    },
    [synth],
  )

  useEffect(() => () => synth?.cancel(), [synth])

  return { supported: Boolean(synth), speaking, speak, stop }
}
