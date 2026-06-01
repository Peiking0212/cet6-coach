import type { StoreState } from '@/store/types'
import { flattenDayTasks, type FlatSprintTask, type SprintDay } from './types'
import { SPRINT_PLAN, SPRINT_TOTAL_DAYS } from './plan'

export function getActiveSprintDay(state: StoreState): number {
  const { unlockedDay, dayCompletedAt } = state.sprint
  for (let d = 1; d <= unlockedDay; d++) {
    if (!dayCompletedAt[d]) return d
  }
  return Math.min(unlockedDay, SPRINT_TOTAL_DAYS)
}

export function isDayUnlocked(state: StoreState, day: number): boolean {
  return day <= state.sprint.unlockedDay
}

export function isDayFinished(state: StoreState, day: number): boolean {
  return Boolean(state.sprint.dayCompletedAt[day])
}

export function dayTasks(day: SprintDay): FlatSprintTask[] {
  return flattenDayTasks(day)
}

export function dayProgress(state: StoreState, day: SprintDay) {
  const tasks = dayTasks(day)
  const done = tasks.filter((t) => state.sprint.completedTasks[t.id]).length
  return { done, total: tasks.length, tasks }
}

export function isDayTasksComplete(state: StoreState, day: SprintDay): boolean {
  const { done, total } = dayProgress(state, day)
  return total > 0 && done >= total
}

export function firstIncompleteIndex(state: StoreState, day: SprintDay): number {
  const tasks = dayTasks(day)
  const saved = state.sprint.currentTaskIndex[day.day]
  if (saved !== undefined && saved < tasks.length) {
    if (!state.sprint.completedTasks[tasks[saved]?.id]) return saved
  }
  const idx = tasks.findIndex((t) => !state.sprint.completedTasks[t.id])
  return idx >= 0 ? idx : Math.max(0, tasks.length - 1)
}

export function sprintOverview(state: StoreState) {
  let totalTasks = 0
  let doneTasks = 0
  for (const d of SPRINT_PLAN) {
    const p = dayProgress(state, d)
    totalTasks += p.total
    doneTasks += p.done
  }
  return { totalTasks, doneTasks, daysFinished: Object.keys(state.sprint.dayCompletedAt).length }
}

export function todayEntryLabel(state: StoreState): { title: string; subtitle: string; path: string } {
  const dayNum = getActiveSprintDay(state)
  const day = SPRINT_PLAN[dayNum - 1]
  if (!state.sprint.startedAt) {
    return { title: '开始 12 天冲刺', subtitle: '19:00–21:00 · 过425计划', path: '/sprint/today' }
  }
  if (isDayFinished(state, dayNum)) {
    return {
      title: `第 ${dayNum} 天已完成`,
      subtitle: '查看总结或进入下一天',
      path: `/sprint/day/${dayNum}/summary`,
    }
  }
  const { done, total } = dayProgress(state, day)
  return {
    title: `今日 · 第 ${dayNum} 天`,
    subtitle: `${day.goal} · 还剩 ${total - done} 项`,
    path: '/sprint/today',
  }
}
