import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/StoreProvider'
import { PageHeader } from '@/components/PageHeader'
import { SPRINT_PLAN, SPRINT_TOTAL_DAYS } from '@/sprint/plan'
import {
  dayProgress,
  getActiveSprintDay,
  isDayFinished,
  isDayUnlocked,
  sprintOverview,
} from '@/sprint/helpers'
import { SprintTodayEntry } from './SprintTodayEntry'

export function SprintOverviewPage() {
  const { state, sprintStart } = useStore()
  const nav = useNavigate()
  const overview = sprintOverview(state)
  const activeDay = getActiveSprintDay(state)

  return (
    <div className="sprint-overview">
      <PageHeader
        title="12 天六级冲刺"
        subtitle={`${overview.daysFinished}/${SPRINT_TOTAL_DAYS} 天完成 · ${overview.doneTasks}/${overview.totalTasks} 项打卡`}
      />

      <SprintTodayEntry className="sprint-overview-hero" />

      <div className="sprint-calendar">
        {SPRINT_PLAN.map((d) => {
          const unlocked = isDayUnlocked(state, d.day)
          const finished = isDayFinished(state, d.day)
          const current = d.day === activeDay && !finished
          const { done, total } = dayProgress(state, d)
          return (
            <Link
              key={d.day}
              to={unlocked ? (finished ? `/sprint/day/${d.day}/summary` : `/sprint/day/${d.day}`) : '#'}
              className={`sprint-day-card card${finished ? ' finished' : ''}${current ? ' current' : ''}${!unlocked ? ' locked' : ''}`}
              onClick={(e) => {
                if (!unlocked) e.preventDefault()
              }}
            >
              <div className="sprint-day-num">第 {d.day} 天</div>
              <div className="sprint-day-title">{d.title}</div>
              <div className="sprint-day-progress">
                {finished ? '✓ 已完成' : unlocked ? `${done}/${total} 项` : '🔒 锁定'}
              </div>
            </Link>
          )
        })}
      </div>

      {!state.sprint.startedAt && (
        <button
          className="btn btn-primary"
          onClick={() => {
            sprintStart()
            nav('/sprint/today')
          }}
        >
          开始第 1 天
        </button>
      )}
    </div>
  )
}
