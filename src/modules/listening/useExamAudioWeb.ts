import { useCallback, useEffect, useRef, useState } from 'react'
import { assetUrl } from '@/lib/assetUrl'

/** HTML5 audio — browser, PWA, and Capacitor WebView (bundled dist/audio). */
export function useExamAudioWeb(audioUrl?: string) {
  const resolvedUrl = assetUrl(audioUrl)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [rate, setRateState] = useState(1)
  const [loading, setLoading] = useState(Boolean(resolvedUrl?.trim()))
  const [loadFailed, setLoadFailed] = useState(false)
  const hasUrl = Boolean(resolvedUrl?.trim())
  const available = hasUrl && !loading && !loadFailed

  useEffect(() => {
    if (!resolvedUrl) {
      setLoading(false)
      setLoadFailed(false)
      return
    }
    setLoading(true)
    setLoadFailed(false)
    setPlaying(false)

    const el = new Audio(resolvedUrl)
    el.preload = 'auto'
    audioRef.current = el

    const onReady = () => {
      setLoading(false)
      setLoadFailed(false)
    }
    const onError = () => {
      setLoading(false)
      setLoadFailed(true)
      setPlaying(false)
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)

    el.addEventListener('canplaythrough', onReady)
    el.addEventListener('loadeddata', onReady)
    el.addEventListener('error', onError)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    el.load()

    return () => {
      el.pause()
      el.removeEventListener('canplaythrough', onReady)
      el.removeEventListener('loadeddata', onReady)
      el.removeEventListener('error', onError)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
      audioRef.current = null
    }
  }, [resolvedUrl])

  const play = useCallback(() => {
    const el = audioRef.current
    if (!el || loadFailed) return
    el.playbackRate = rate
    void el.play().catch(() => setPlaying(false))
  }, [rate, loadFailed])

  const stop = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    el.currentTime = 0
    setPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el || loadFailed) return
    if (el.paused) {
      el.playbackRate = rate
      void el.play().catch(() => setPlaying(false))
    } else {
      el.pause()
    }
  }, [rate, loadFailed])

  const setRate = useCallback((r: number) => {
    setRateState(r)
    const el = audioRef.current
    if (el) el.playbackRate = r
  }, [])

  return { available, loading, loadFailed, playing, rate, play, stop, toggle, setRate }
}
