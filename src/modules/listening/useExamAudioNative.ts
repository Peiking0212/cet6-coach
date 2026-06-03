import { useCallback, useEffect, useRef, useState } from 'react'
import { NativeAudio } from '@capgo/native-audio'
import { assetUrl } from '@/lib/assetUrl'

function toAssetId(resolvedUrl: string): string {
  return `exam-${resolvedUrl.replace(/[^a-z0-9]+/gi, '-').slice(0, 80)}`
}

function toAbsoluteUrl(resolvedUrl: string): string {
  return new URL(resolvedUrl, window.location.href).href
}

/** Plugin documents 0.1–1.0; clamp faster UI speeds (e.g. 1.2×). */
function clampNativeRate(rate: number): number {
  return Math.min(1, Math.max(0.1, rate))
}

/** @capgo/native-audio — Capacitor APK; supports background playback. */
export function useExamAudioNative(audioUrl?: string) {
  const resolvedUrl = assetUrl(audioUrl)
  const assetIdRef = useRef<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [rate, setRateState] = useState(1)
  const [loading, setLoading] = useState(Boolean(resolvedUrl?.trim()))
  const [loadFailed, setLoadFailed] = useState(false)
  const available = Boolean(resolvedUrl?.trim()) && !loading && !loadFailed

  useEffect(() => {
    if (!resolvedUrl) {
      setLoading(false)
      setLoadFailed(false)
      return
    }
    const assetId = toAssetId(resolvedUrl)
    assetIdRef.current = assetId
    const absolute = toAbsoluteUrl(resolvedUrl)
    let cancelled = false

    void NativeAudio.preload({
      assetId,
      assetPath: absolute,
      isUrl: true,
    })
      .then(() => {
        if (!cancelled) {
          setLoading(false)
          setLoadFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          assetIdRef.current = null
          setLoading(false)
          setLoadFailed(true)
        }
      })

    return () => {
      cancelled = true
      void NativeAudio.unload({ assetId }).catch(() => {})
      assetIdRef.current = null
      setPlaying(false)
    }
  }, [resolvedUrl])

  const play = useCallback(async () => {
    const assetId = assetIdRef.current
    if (!assetId) return
    try {
      await NativeAudio.setRate({ assetId, rate: clampNativeRate(rate) })
      await NativeAudio.play({ assetId })
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }, [rate])

  const stop = useCallback(async () => {
    const assetId = assetIdRef.current
    if (!assetId) return
    try {
      await NativeAudio.stop({ assetId })
    } catch {
      /* ignore */
    }
    setPlaying(false)
  }, [])

  const toggle = useCallback(async () => {
    if (playing) {
      const assetId = assetIdRef.current
      if (!assetId) return
      try {
        await NativeAudio.pause({ assetId })
      } catch {
        /* ignore */
      }
      setPlaying(false)
    } else {
      await play()
    }
  }, [playing, play])

  const setRate = useCallback((r: number) => {
    setRateState(r)
    const assetId = assetIdRef.current
    if (!assetId) return
    void NativeAudio.setRate({ assetId, rate: clampNativeRate(r) }).catch(() => {})
  }, [])

  return { available, playing, rate, loading, loadFailed, play, stop, toggle, setRate }
}
