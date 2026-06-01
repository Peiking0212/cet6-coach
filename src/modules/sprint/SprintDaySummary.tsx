import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '@/store/StoreProvider'
import { PageHeader } from '@/components/PageHeader'
import { formatTime } from '@/engine/useTimer'
import { getSprintDay, SPRINT_TOTAL_DAYS } from '@/sprint/plan'
import { dayProgress, isDayUnlocked } from '@/sprint/helpers'

export function SprintDaySummary() {
  const { day } = useParams()
  const dayNum = Number(day)
  const nav = useNavigate()
  const { state, sprintSetDayNote, sprintFinishDay } = useStore()
  const sprintDay = getSprintDay(dayNum)
  const [note, setNote] = useState(state.sprint.dayNotes[dayNum] ?? '')

  if (!sprintDay || !isDayUnlocked(state, dayNum)) {
    return (
      <div>
        <PageHeader title="无法访问" subtitle="" />
        <button className="btn btn-primary" onClick={() => nav('/sprint')}>
          返回
        </button>
      </div>
    )
  }

  const { done, total } = dayProgress(state, sprintDay)
  const stats = state.sprint.dayStats[dayNum]
  const finished = Boolean(state.sprint.dayCompletedAt[dayNum])
  const accuracy =
    stats?.practiceTotal && stats.practiceTotal > 0
      ? Math.round(((stats.practiceCorrect ?? 0) / stats.practiceTotal) * 100)
      : null

  const finish = () => {
    sprintSetDayNote(dayNum, note)
    sprintFinishDay(dayNum, stats ?? { totalTimeMs: 0, tasksDone: done })
    nav('/')
  }

  return (
    <div className="sprint-summary">
      <PageHeader title={`第 ${dayNum} 天完成`} subtitle={sprintDay.title} />

      <div className="sprint-summary-stats card">
        <div className="sprint-summary-stat">
          <span className="sprint-summary-num">
            {done}/{total}
          </span>
          <span className="sprint-summary-lbl">任务完成</span>
        </div>
        {stats?.totalTimeMs ? (
          <div className="sprint-summary-stat">
            <span className="sprint-summary-num">{formatTime(stats.totalTimeMs)}</span>
            <span className="sprint-summary-lbl">总用时</span>
          </div>
        ) : null}
        {accuracy !== null && (
          <div className="sprint-summary-stat">
            <span className="sprint-summary-num">{accuracy}%</span>
            <span className="sprint-summary-lbl">做题正确率</span>
          </div>
        )}
      </div>

      <div className="card sprint-summary-reminders">
        <h3>提醒</h3>
        <ul>
          {sprintDay.summaryReminders.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="card sprint-summary-note">
        <h3>今日备注</h3>
        <textarea
          rows={4}
          placeholder="记录错题要点、感受…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {finished ? (
        <div className="sprint-summary-actions">
          <button className="btn btn-primary" onClick={() => nav('/')}>
            回首页
          </button>
          {dayNum < SPRINT_TOTAL_DAYS && (
            <button className="btn btn-ghost" onClick={() => nav('/sprint/today')}>
              进入第 {dayNum + 1} 天
            </button>
          )}
        </div>
      ) : (
        <button className="btn btn-primary sprint-finish-day" onClick={finish}>
          完成今日，明天见
        </button>
      )}
    </div>
  )
}
