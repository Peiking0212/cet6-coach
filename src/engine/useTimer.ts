import { useEffect, useRef, useState } from 'react'

export function useTimer(running: boolean) {
  const [ms, setMs] = useState(0)
  const start = useRef<number>(Date.now())
  const acc = useRef<number>(0)

  useEffect(() => {
    if (!running) return
    start.current = Date.now()
    const id = window.setInterval(() => {
      setMs(acc.current + (Date.now() - start.current))
    }, 250)
    return () => {
      acc.current += Date.now() - start.current
      window.clearInterval(id)
    }
  }, [running])

  const reset = () => {
    acc.current = 0
    start.current = Date.now()
    setMs(0)
  }

  return { ms, reset }
}

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
