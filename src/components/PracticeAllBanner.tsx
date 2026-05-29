import type { ModuleCountInfo } from '@/engine/practiceAll'

export function PracticeAllBanner({
  label,
  count,
  detail,
  shuffled,
  onStart,
  onToggleShuffle,
  showShuffle = true,
}: {
  label: string
  count: ModuleCountInfo
  detail?: string
  shuffled: boolean
  onStart: () => void
  onToggleShuffle: () => void
  showShuffle?: boolean
}) {
  return (
    <div className="practice-all-banner card">
      <div className="practice-all-banner-main">
        <div className="practice-all-banner-tag">全部练习</div>
        <h3>{label}</h3>
        <p>
          共 <strong>{count.total}</strong> {detail ?? count.detail}，顺序刷完不遗漏
        </p>
      </div>
      <div className="practice-all-banner-actions">
        {showShuffle && (
          <button
            type="button"
            className={`btn btn-ghost practice-all-shuffle${shuffled ? ' active' : ''}`}
            onClick={onToggleShuffle}
            aria-pressed={shuffled}
          >
            {shuffled ? '🔀 随机顺序' : '📋 按序练习'}
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={onStart}>
          开始全部练习 →
        </button>
      </div>
    </div>
  )
}

export function PracticeAllProgress({
  index,
  total,
  moduleLabel,
}: {
  index: number
  total: number
  moduleLabel: string
}) {
  const pct = total > 0 ? Math.round(((index + 1) / total) * 100) : 0
  return (
    <div className="practice-all-progress card">
      <div className="practice-all-progress-head">
        <span className="pill">全部练习 · {moduleLabel}</span>
        <span className="practice-all-progress-count">
          {index + 1} / {total}
        </span>
      </div>
      <div className="practice-all-progress-bar">
        <div className="practice-all-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
