import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/store/StoreProvider'
import { PageHeader } from '@/components/PageHeader'
import { getSprintDay } from '@/sprint/plan'
import {
  dayProgress,
  dayTasks,
  firstIncompleteIndex,
  getActiveSprintDay,
  isDayFinished,
  isDayTasksComplete,
  isDayUnlocked,
} from '@/sprint/helpers'
import { SprintTimerPanel } from './SprintTimerPanel'
import { SprintTaskRunner } from './SprintTaskRunner'

export function SprintDayFlow({ dayNum }: { dayNum: number }) {
  const { state, sprintStart, sprintCompleteTask, sprintSetTaskIndex } = useStore()
  const nav = useNavigate()
  const day = getSprintDay(dayNum)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [justDone, setJustDone] = useState(false)

  const tasks = useMemo(() => (day ? dayTasks(day) : []), [day])
  const activeIndex = state.sprint.currentTaskIndex[dayNum] ?? (day ? firstIncompleteIndex(state, day) : 0)
  const task = tasks[activeIndex]
  const progress = day ? dayProgress(state, day) : { done: 0, total: 0, tasks: [] }

  useEffect(() => {
    if (!day) return
    if (isDayFinished(state, dayNum) || isDayTasksComplete(state, day)) {
      nav(`/sprint/day/${dayNum}/summary`, { replace: true })
    }
  }, [day, dayNum, nav, state])

  if (!day) {
    return (
      <div>
        <PageHeader title="未找到" subtitle="" />
        <button className="btn btn-primary" onClick={() => nav('/sprint')}>
          返回
        </button>
      </div>
    )
  }

  if (!isDayUnlocked(state, dayNum)) {
    return (
      <div>
        <PageHeader title={`第 ${dayNum} 天已锁定`} subtitle="请先完成上一天全部任务" />
        <button className="btn btn-primary" onClick={() => nav('/sprint')}>
          返回总览
        </button>
      </div>
    )
  }

  if (isDayFinished(state, dayNum) || isDayTasksComplete(state, day)) {
    return null
  }

  const completeCurrent = (opts?: { correct?: number; total?: number; timeMs?: number }) => {
    if (!task) return
    sprintCompleteTask(task.id, dayNum, opts)
    setJustDone(true)
    window.setTimeout(() => {
      setJustDone(false)
      const nextIdx = activeIndex + 1
      if (nextIdx >= tasks.length) {
        nav(`/sprint/day/${dayNum}/summary`)
      } else {
        sprintSetTaskIndex(dayNum, nextIdx)
      }
    }, 600)
  }

  useEffect(() => {
    if (!state.sprint.startedAt) sprintStart()
  }, [state.sprint.startedAt, sprintStart])

  const isChecklist =
    task?.kind === 'checklist' || task?.kind === 'review' || task?.manualComplete
  const isDone = task ? state.sprint.completedTasks[task.id] : false

  return (
    <div className="sprint-day-flow">
      <PageHeader
        title={`第 ${dayNum} 天 · ${day.title}`}
        subtitle={`${day.goal} · 进度 ${progress.done}/${progress.total}`}
      />

      <div className="sprint-progress-bar">
        <div
          className="sprint-progress-fill"
          style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
        />
      </div>

      {task && (
        <div className="sprint-step-layout">
          <div className="sprint-step-main">
            <div className="sprint-step-meta">
              <span className="pill">{task.blockTime}</span>
              <span className="pill">{task.blockTitle}</span>
              <span className="sprint-step-index">
                {activeIndex + 1} / {tasks.length}
              </span>
            </div>

            <div className={`sprint-step-card card${justDone ? ' sprint-step-done-flash' : ''}`}>
              <h2 className="sprint-step-label">{task.label}</h2>
              {task.tips && <p className="sprint-step-tips">{task.tips}</p>}

              {isChecklist ? (
                <div className="sprint-checklist-actions">
                  <button
                    className="btn btn-primary sprint-checkin-btn"
                    disabled={isDone}
                    onClick={() => completeCurrent()}
                  >
                    {isDone ? '✓ 已打卡' : '完成了，打卡'}
                  </button>
                </div>
              ) : (
                <SprintTaskRunner task={task} onDone={(stats) => completeCurrent(stats)} />
              )}
            </div>
          </div>

          <SprintTimerPanel durationMin={task.mockDurationMin ?? task.durationMin} running={!isDone} />
        </div>
      )}

      <div className="sprint-step-nav">
        <button
          className="btn btn-ghost"
          disabled={activeIndex <= 0}
          onClick={() => sprintSetTaskIndex(dayNum, activeIndex - 1)}
        >
          ‹ 上一项
        </button>
        <button className="btn btn-ghost" onClick={() => setDrawerOpen((o) => !o)}>
          ≡ 今日清单 ({progress.done}/{progress.total})
        </button>
        <button
          className="btn btn-ghost"
          disabled={activeIndex >= tasks.length - 1}
          onClick={() => sprintSetTaskIndex(dayNum, activeIndex + 1)}
        >
          下一项 ›
        </button>
      </div>

      {drawerOpen && (
        <div className="sprint-drawer card">
          <ul className="sprint-drawer-list">
            {tasks.map((t, i) => (
              <li key={t.id} className={state.sprint.completedTasks[t.id] ? 'done' : i === activeIndex ? 'active' : ''}>
                <button type="button" className="sprint-drawer-item" onClick={() => sprintSetTaskIndex(dayNum, i)}>
                  {state.sprint.completedTasks[t.id] ? '✓' : '○'} {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function SprintDayRoute() {
  const { day } = useParams()
  const dayNum = Number(day)
  return <SprintDayFlow dayNum={dayNum} />
}

export function SprintTodayRoute() {
  const { state } = useStore()
  const dayNum = getActiveSprintDay(state)
  return <SprintDayFlow dayNum={dayNum} />
}
