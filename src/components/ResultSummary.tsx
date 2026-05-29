import { Stars } from './Stars'
import { formatTime } from '@/engine/useTimer'

export function ResultSummary({
  correct,
  total,
  timeMs,
  stars,
  onAgain,
  onExit,
  exitLabel = '完成',
}: {
  correct: number
  total: number
  timeMs: number
  stars: number
  onAgain?: () => void
  onExit: () => void
  exitLabel?: string
}) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const msg = pct >= 90 ? '太棒了！' : pct >= 60 ? '不错，继续加油！' : '别灰心，再来一遍～'
  return (
    <div className="done-card card fade-in">
      <div className="done-emoji">{pct >= 90 ? '🌟' : pct >= 60 ? '👍' : '💪'}</div>
      <h2>{msg}</h2>
      <div className="result-stars">
        <Stars value={stars} size={26} />
      </div>
      <div className="result-stats">
        <div>
          <strong>{correct}/{total}</strong>
          <span>正确</span>
        </div>
        <div>
          <strong>{pct}%</strong>
          <span>正确率</span>
        </div>
        <div>
          <strong>{formatTime(timeMs)}</strong>
          <span>用时</span>
        </div>
      </div>
      <div className="result-actions">
        {onAgain && (
          <button className="btn" onClick={onAgain}>
            再来一遍
          </button>
        )}
        <button className="btn btn-primary" onClick={onExit}>
          {exitLabel}
        </button>
      </div>
    </div>
  )
}
