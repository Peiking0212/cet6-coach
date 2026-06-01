import { formatCountdown, useCountdown } from '@/engine/useCountdown'
import { useTimer, formatTime } from '@/engine/useTimer'

export function SprintTimerPanel({
  durationMin,
  running,
}: {
  durationMin: number
  running: boolean
}) {
  const durationMs = durationMin * 60 * 1000
  const { remainMs, expired } = useCountdown(durationMs, running)
  const { ms: elapsedMs } = useTimer(running)
  const pct = durationMs > 0 ? Math.max(0, (remainMs / durationMs) * 100) : 0

  return (
    <aside className="sprint-timer-panel card">
      <div className="sprint-timer-label">建议剩余</div>
      <div className={`sprint-timer-countdown${expired ? ' expired' : ''}`}>
        {formatCountdown(remainMs)}
      </div>
      <div className="sprint-timer-bar">
        <div className="sprint-timer-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="sprint-timer-elapsed">已用 {formatTime(elapsedMs)}</div>
      {expired && <div className="sprint-timer-warn">到点就停，不返工</div>}
    </aside>
  )
}
