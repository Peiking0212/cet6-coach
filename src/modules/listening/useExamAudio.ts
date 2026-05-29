import { useCallback, useEffect, useRef, useState } from 'react'
import { assetUrl } from '@/lib/assetUrl'

export function useExamAudio(audioUrl?: string) {
  const resolvedUrl = assetUrl(audioUrl)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [rate, setRateState] = useState(1)
  const available = Boolean(resolvedUrl?.trim())

  useEffect(() => {
    if (!resolvedUrl) return
    const el = new Audio(resolvedUrl)
    audioRef.current = el
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    return () => {
      el.pause()
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
      audioRef.current = null
    }
  }, [resolvedUrl])

  const play = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    void el.play()
  }, [])

  const stop = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    el.currentTime = 0
  }, [])

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }, [])

  const setRate = useCallback((r: number) => {
    setRateState(r)
    const el = audioRef.current
    if (el) el.playbackRate = r
  }, [])

  return { available, playing, rate, play, stop, toggle, setRate }
}
