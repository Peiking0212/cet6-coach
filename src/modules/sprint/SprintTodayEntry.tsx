import { Link } from 'react-router-dom'
import { useStore } from '@/store/StoreProvider'
import { todayEntryLabel } from '@/sprint/helpers'

export function SprintTodayEntry({ className = '' }: { className?: string }) {
  const { state } = useStore()
  const entry = todayEntryLabel(state)

  return (
    <Link to={entry.path} className={`sprint-today-entry card ${className}`.trim()}>
      <div className="sprint-today-badge">12天冲刺</div>
      <div className="sprint-today-title">{entry.title}</div>
      <div className="sprint-today-sub">{entry.subtitle}</div>
      <div className="sprint-today-cta">进入 →</div>
    </Link>
  )
}
