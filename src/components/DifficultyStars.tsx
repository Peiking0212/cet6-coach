import { difficultyLabel } from '@/store/adaptive'

export function DifficultyStars({ level }: { level: number }) {
  return <span className="quizbar-diff">{difficultyLabel(level)}</span>
}
