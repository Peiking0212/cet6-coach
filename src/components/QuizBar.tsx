import { formatTime } from '@/engine/useTimer'
import { IconFlame } from '@/app/icons'
import { DifficultyStars } from '@/components/DifficultyStars'

export function QuizBar({
  index,
  total,
  timeMs,
  combo,
  difficulty,
}: {
  index: number
  total: number
  timeMs: number
  combo: number
  difficulty?: number
}) {
  const pct = total > 0 ? (index / total) * 100 : 0
  return (
    <div className="quizbar card">
      <div className="quizbar-top">
        <span className="quizbar-count">
          第 {Math.min(index + 1, total)} / {total} 题
        </span>
        <div className="quizbar-meta">
          {difficulty != null && <DifficultyStars level={difficulty} />}
          {combo > 1 && (
            <span className="quizbar-combo">
              <IconFlame size={14} /> {combo}
            </span>
          )}
          <span className="quizbar-timer">{formatTime(timeMs)}</span>
        </div>
      </div>
      <div className="quizbar-track">
        <div className="quizbar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
