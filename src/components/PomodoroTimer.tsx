import { useEffect, useState } from 'react'
import { formatTime } from '@/engine/useTimer'

type Phase = 'work' | 'break' | 'idle'

const WORK_SEC = 25 * 60
const BREAK_SEC = 5 * 60

export function PomodoroTimer() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [left, setLeft] = useState(WORK_SEC)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || phase === 'idle') return
    const t = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          if (phase === 'work') {
            setPhase('break')
            return BREAK_SEC
          }
          setPhase('idle')
          setRunning(false)
          return WORK_SEC
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running, phase])

  const start = () => {
    setPhase('work')
    setLeft(WORK_SEC)
    setRunning(true)
  }

  const reset = () => {
    setRunning(false)
    setPhase('idle')
    setLeft(WORK_SEC)
  }

  const label =
    phase === 'work' ? '专注' : phase === 'break' ? '休息' : '番茄钟'

  return (
    <div className="pomodoro card">
      <div className="pomodoro-row">
        <span className="pomodoro-label">{label}</span>
        <span className="pomodoro-time">{formatTime(left * 1000)}</span>
      </div>
      <div className="pomodoro-btns">
        {phase === 'idle' ? (
          <button type="button" className="chip-btn" onClick={start}>
            25+5 开始
          </button>
        ) : (
          <>
            <button type="button" className="chip-btn" onClick={() => setRunning((r) => !r)}>
              {running ? '暂停' : '继续'}
            </button>
            <button type="button" className="chip-btn" onClick={reset}>
              重置
            </button>
          </>
        )}
      </div>
    </div>
  )
}
