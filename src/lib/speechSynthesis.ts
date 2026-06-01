/** Mobile-safe Web Speech API helpers (iOS Safari / PWA). */

export function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis ?? null
}

export function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null
  return (
    voices.find(
      (v) => /en[-_]US/i.test(v.lang) && /female|natural|google|samantha/i.test(v.name),
    ) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    voices[0] ||
    null
  )
}

/** Unblock iOS Safari / PWA speech synthesis (often paused until resume). */
export function prepareSpeechSynth(synth: SpeechSynthesis): SpeechSynthesisVoice[] {
  const voices = synth.getVoices()
  if (synth.paused) synth.resume()
  return voices
}

const MAX_CHUNK = 200

/** Split long text into smaller chunks for more reliable mobile TTS. */
export function chunkForSpeech(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (trimmed.length <= MAX_CHUNK) return [trimmed]

  const parts: string[] = []
  let rest = trimmed
  while (rest.length > MAX_CHUNK) {
    const slice = rest.slice(0, MAX_CHUNK)
    const breakAt = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf(', '), slice.lastIndexOf(' '))
    const cut = breakAt > 40 ? breakAt + 1 : MAX_CHUNK
    parts.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

export interface SpeakOptions {
  rate?: number
  voice?: SpeechSynthesisVoice | null
  onStart?: () => void
  onEnd?: () => void
}

/**
 * Speak text with mobile-friendly prep. Call synchronously inside a user click handler when possible.
 */
export function speakText(synth: SpeechSynthesis, text: string, opts: SpeakOptions = {}): void {
  const chunks = chunkForSpeech(text)
  if (!chunks.length) return

  synth.cancel()
  prepareSpeechSynth(synth)

  let i = 0
  const speakNext = () => {
    if (i >= chunks.length) {
      opts.onEnd?.()
      return
    }
    const chunk = chunks[i]!
    const isFirst = i === 0
    const isLast = i === chunks.length - 1

    const u = new SpeechSynthesisUtterance(chunk)
    u.lang = 'en-US'
    u.rate = opts.rate ?? 0.9
    if (opts.voice) u.voice = opts.voice

    u.onstart = () => {
      if (isFirst) opts.onStart?.()
    }
    u.onend = () => {
      i += 1
      if (i >= chunks.length) opts.onEnd?.()
      else {
        prepareSpeechSynth(synth)
        speakNext()
      }
    }
    u.onerror = () => {
      if (isLast) opts.onEnd?.()
    }

    synth.speak(u)
    if (synth.paused) synth.resume()
  }

  speakNext()
}
