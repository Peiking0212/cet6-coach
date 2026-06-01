import { useEffect, useRef, useState } from 'react'

export function useCountdown(durationMs: number, running: boolean) {
  const [remainMs, setRemainMs] = useState(durationMs)
  const [expired, setExpired] = useState(false)
  const startRef = useRef(Date.now())
  const pausedRemain = useRef(durationMs)

  useEffect(() => {
    pausedRemain.current = durationMs
    setRemainMs(durationMs)
    setExpired(false)
  }, [durationMs])

  useEffect(() => {
    if (!running) return
    startRef.current = Date.now()
    const id = window.setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const next = Math.max(0, pausedRemain.current - elapsed)
      setRemainMs(next)
      if (next <= 0) setExpired(true)
    }, 250)
    return () => {
      pausedRemain.current = Math.max(0, pausedRemain.current - (Date.now() - startRef.current))
      window.clearInterval(id)
    }
  }, [running, durationMs])

  const reset = (ms = durationMs) => {
    pausedRemain.current = ms
    startRef.current = Date.now()
    setRemainMs(ms)
    setExpired(false)
  }

  return { remainMs, expired, reset }
}

export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
