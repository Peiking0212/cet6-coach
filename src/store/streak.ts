import { todayStr, weekKey } from './defaults'
import type { StoreState } from './types'

function daysBetween(a: string, b: string): number {
  if (!a || !b) return 999
  const da = new Date(a + 'T12:00:00')
  const db = new Date(b + 'T12:00:00')
  return Math.round((db.getTime() - da.getTime()) / (24 * 3600 * 1000))
}

export function canOfferMakeup(state: StoreState): boolean {
  const today = todayStr()
  if (state.streak.lastDate === today) return false
  const gap = daysBetween(state.streak.lastDate, today)
  if (gap !== 2) return false
  const wk = weekKey()
  if (state.makeup.weekKey === wk && state.makeup.used) return false
  return state.streak.count > 0
}

export function updateStreakOnPractice(state: StoreState): StoreState {
  const today = todayStr()
  if (state.streak.lastDate === today) return state

  const yesterday = todayStr(new Date(Date.now() - 86400000))
  let count = state.streak.count
  if (!state.streak.lastDate) {
    count = 1
  } else if (state.streak.lastDate === yesterday) {
    count += 1
  } else {
    count = 1
  }

  return {
    ...state,
    streak: {
      count,
      longest: Math.max(state.streak.longest, count),
      lastDate: today,
    },
  }
}

export function applyMakeup(state: StoreState): StoreState {
  const today = todayStr()
  const count = Math.max(1, state.streak.count + 1)
  const wk = weekKey()
  return {
    ...state,
    streak: {
      count,
      longest: Math.max(state.streak.longest, count),
      lastDate: today,
    },
    makeup: { weekKey: wk, used: true },
  }
}
