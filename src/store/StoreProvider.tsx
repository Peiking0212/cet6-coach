import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { initAppStorage, storageGet, storageSet } from '@/lib/appStorage'
import { configureNativeAudio } from '@/lib/nativeAudioSetup'
import type { ModuleType } from '@/data/types'
import type { AttemptResult, WrongItem } from '@/engine/types'
import type { AiConfig, PlacementLevel, StoreState, ThemeMode, VocabGrade } from './types'
import {
  makeDefaultState,
  SRS_INTERVALS_MS,
  STORE_KEY,
  todayStr,
  VOCAB_AGAIN_MS,
} from './defaults'
import { mergeImportedState } from './backup'
import { applyAttemptDifficulty } from './adaptive'
import { applyMakeup, updateStreakOnPractice } from './streak'

type Action =
  | { type: 'record'; result: AttemptResult }
  | { type: 'reviewDone'; key: string; correct: boolean }
  | { type: 'setStars'; module: ModuleType; levelKey: string; stars: number }
  | { type: 'setTheme'; theme: ThemeMode }
  | { type: 'setAi'; ai: Partial<AiConfig> }
  | { type: 'setGoal'; goal: number }
  | { type: 'vocabGrade'; wordId: string; grade: VocabGrade }
  | { type: 'addReview'; wrong: WrongItem }
  | { type: 'removeReview'; key: string }
  | { type: 'reset' }
  | { type: 'hydrate'; state: StoreState }
  | { type: 'completePlacement'; level: PlacementLevel; baselines: Record<ModuleType, number> }
  | { type: 'resetPlacement' }
  | { type: 'dismissPlacementBanner' }
  | { type: 'useMakeup' }
  | { type: 'setCoach'; text: string; date: string }
  | { type: 'sprintStart' }
  | { type: 'sprintCompleteTask'; taskId: string; day: number; timeMs?: number; correct?: number; total?: number }
  | { type: 'sprintSetTaskIndex'; day: number; index: number }
  | { type: 'sprintSetDayNote'; day: number; note: string }
  | { type: 'sprintFinishDay'; day: number; stats: import('./types').SprintDayStats }
  | { type: 'sprintReset' }

function rollDaily(state: StoreState): StoreState {
  const today = todayStr()
  if (state.daily.date !== today) {
    return { ...state, daily: { date: today, count: 0, goal: state.daily.goal } }
  }
  return state
}

function upsertReview(state: StoreState, wrong: WrongItem): StoreState {
  const existing = state.review.find((c) => c.wrong.key === wrong.key)
  if (existing) return state
  return {
    ...state,
    review: [
      ...state.review,
      { wrong, due: Date.now(), reps: 0, addedAt: Date.now() },
    ],
  }
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'hydrate':
      return action.state
    case 'reset':
      return makeDefaultState()
    case 'completePlacement': {
      const baselines = action.baselines
      return {
        ...state,
        placementDone: true,
        placementLevel: action.level,
        placementBaseline: baselines,
        moduleDifficulty: { ...state.moduleDifficulty, ...baselines },
      }
    }
    case 'resetPlacement':
      return {
        ...state,
        placementDone: false,
        placementLevel: null,
        placementBannerDismissed: false,
      }
    case 'dismissPlacementBanner':
      return { ...state, placementBannerDismissed: true }
    case 'useMakeup':
      return applyMakeup(state)
    case 'setCoach':
      return { ...state, coach: { date: action.date, text: action.text } }
    case 'sprintStart':
      return {
        ...state,
        sprint: {
          ...state.sprint,
          startedAt: state.sprint.startedAt ?? todayStr(),
        },
      }
    case 'sprintCompleteTask': {
      const completedTasks = { ...state.sprint.completedTasks, [action.taskId]: true }
      const dayStats = { ...state.sprint.dayStats }
      const prev = dayStats[action.day] ?? { totalTimeMs: 0, tasksDone: 0, practiceCorrect: 0, practiceTotal: 0 }
      dayStats[action.day] = {
        totalTimeMs: prev.totalTimeMs + (action.timeMs ?? 0),
        tasksDone: prev.tasksDone + 1,
        practiceCorrect: (prev.practiceCorrect ?? 0) + (action.correct ?? 0),
        practiceTotal: (prev.practiceTotal ?? 0) + (action.total ?? 0),
      }
      return { ...state, sprint: { ...state.sprint, completedTasks, dayStats } }
    }
    case 'sprintSetTaskIndex':
      return {
        ...state,
        sprint: {
          ...state.sprint,
          currentTaskIndex: { ...state.sprint.currentTaskIndex, [action.day]: action.index },
        },
      }
    case 'sprintSetDayNote':
      return {
        ...state,
        sprint: {
          ...state.sprint,
          dayNotes: { ...state.sprint.dayNotes, [action.day]: action.note },
        },
      }
    case 'sprintFinishDay':
      return {
        ...state,
        sprint: {
          ...state.sprint,
          unlockedDay: Math.max(state.sprint.unlockedDay, action.day + 1),
          dayCompletedAt: { ...state.sprint.dayCompletedAt, [action.day]: todayStr() },
          dayStats: { ...state.sprint.dayStats, [action.day]: action.stats },
        },
      }
    case 'sprintReset':
      return {
        ...state,
        sprint: {
          startedAt: null,
          unlockedDay: 1,
          currentTaskIndex: {},
          completedTasks: {},
          dayCompletedAt: {},
          dayNotes: {},
          dayStats: {},
        },
      }
    case 'setTheme':
      return { ...state, theme: action.theme }
    case 'setAi':
      return { ...state, ai: { ...state.ai, ...action.ai } }
    case 'setGoal':
      return { ...state, daily: { ...state.daily, goal: Math.max(1, action.goal) } }
    case 'addReview':
      return upsertReview(state, action.wrong)
    case 'removeReview':
      return { ...state, review: state.review.filter((c) => c.wrong.key !== action.key) }
    case 'vocabGrade': {
      const now = Date.now()
      const prev = state.vocab[action.wordId] ?? {
        familiarity: 0,
        reps: 0,
        due: now,
        seen: 0,
        correct: 0,
        firstAt: now,
        lastAt: now,
      }
      let familiarity = prev.familiarity
      let reps = prev.reps
      let due = now
      if (action.grade === 'know') {
        familiarity = Math.min(5, prev.familiarity + 1)
        reps = Math.min(SRS_INTERVALS_MS.length - 1, prev.reps + 1)
        due = now + SRS_INTERVALS_MS[reps]
      } else if (action.grade === 'fuzzy') {
        familiarity = prev.familiarity
        reps = Math.max(1, Math.min(prev.reps, 2))
        due = now + SRS_INTERVALS_MS[1]
      } else {
        familiarity = Math.max(0, prev.familiarity - 1)
        reps = 0
        due = now + VOCAB_AGAIN_MS
      }
      return {
        ...state,
        vocab: {
          ...state.vocab,
          [action.wordId]: {
            familiarity,
            reps,
            due,
            seen: prev.seen + 1,
            correct: prev.correct + (action.grade === 'know' ? 1 : 0),
            firstAt: prev.firstAt || now,
            lastAt: now,
          },
        },
      }
    }
    case 'setStars': {
      const cur = state.progress[action.module].stars[action.levelKey] ?? 0
      if (action.stars <= cur) return state
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.module]: {
            stars: { ...state.progress[action.module].stars, [action.levelKey]: action.stars },
          },
        },
      }
    }
    case 'reviewDone': {
      let next = rollDaily(state)
      const idx = next.review.findIndex((c) => c.wrong.key === action.key)
      if (idx < 0) return next
      const card = next.review[idx]
      const review = [...next.review]
      if (action.correct) {
        const reps = card.reps + 1
        if (reps >= SRS_INTERVALS_MS.length) {
          review.splice(idx, 1)
        } else {
          review[idx] = { ...card, reps, due: Date.now() + SRS_INTERVALS_MS[reps] }
        }
      } else {
        review[idx] = { ...card, reps: 0, due: Date.now() + SRS_INTERVALS_MS[1] }
      }
      return { ...next, review }
    }
    case 'record': {
      let next = rollDaily(state)
      const r = action.result
      const stat = next.stats[r.module]
      const nextStat = {
        attempts: stat.attempts + 1,
        correct: stat.correct + r.correct,
        total: stat.total + r.total,
        totalTimeMs: stat.totalTimeMs + r.timeMs,
        lastAt: Date.now(),
      }

      // combo + points
      let combo = next.combo
      let points = next.points
      const wrongCount = r.wrong.length
      const rightCount = Math.max(0, r.total - wrongCount)
      for (let i = 0; i < rightCount; i++) {
        combo += 1
        const mult = 1 + Math.min(combo, 10) * 0.1
        points += Math.round(10 * mult)
      }
      if (wrongCount > 0) combo = 0
      const bestCombo = Math.max(next.bestCombo, combo)

      // review queue: add wrongs, schedule
      let review = next.review
      for (const w of r.wrong) {
        const tmp = upsertReview({ ...next, review }, w)
        review = tmp.review
      }

      const daily = { ...next.daily, count: next.daily.count + r.total }
      next = {
        ...next,
        stats: { ...next.stats, [r.module]: nextStat },
        combo,
        bestCombo,
        points,
        review,
        daily,
        answered: next.answered + r.total,
      }
      next = applyAttemptDifficulty(next, r.module, r.correct, r.total, r.timeMs)
      if (r.total > 0) next = updateStreakOnPractice(next)
      return next
    }
    default:
      return state
  }
}

async function loadState(): Promise<StoreState> {
  try {
    const raw = await storageGet(STORE_KEY)
    if (!raw) return makeDefaultState()
    const parsed = JSON.parse(raw) as Partial<StoreState>
    return mergeImportedState(parsed)
  } catch {
    return makeDefaultState()
  }
}

interface StoreApi {
  state: StoreState
  record: (result: AttemptResult) => void
  reviewDone: (key: string, correct: boolean) => void
  setStars: (module: ModuleType, levelKey: string, stars: number) => void
  setTheme: (theme: ThemeMode) => void
  setAi: (ai: Partial<AiConfig>) => void
  setGoal: (goal: number) => void
  vocabGrade: (wordId: string, grade: VocabGrade) => void
  addReview: (wrong: WrongItem) => void
  removeReview: (key: string) => void
  reset: () => void
  importProgress: (state: StoreState) => void
  dueReviews: () => StoreState['review']
  completePlacement: (level: PlacementLevel, baselines: Record<ModuleType, number>) => void
  resetPlacement: () => void
  dismissPlacementBanner: () => void
  useMakeup: () => void
  setCoach: (text: string, date: string) => void
  sprintStart: () => void
  sprintCompleteTask: (
    taskId: string,
    day: number,
    opts?: { timeMs?: number; correct?: number; total?: number },
  ) => void
  sprintSetTaskIndex: (day: number, index: number) => void
  sprintSetDayNote: (day: number, note: string) => void
  sprintFinishDay: (day: number, stats: import('./types').SprintDayStats) => void
  sprintReset: () => void
}

const StoreContext = createContext<StoreApi | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [state, dispatch] = useReducer(reducer, undefined, makeDefaultState)
  const persistSkip = useRef(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await initAppStorage()
      await configureNativeAudio()
      const loaded = await loadState()
      if (!cancelled) {
        dispatch({ type: 'hydrate', state: loaded })
        persistSkip.current = true
        setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    if (persistSkip.current) {
      persistSkip.current = false
      return
    }
    const timer = window.setTimeout(() => {
      void storageSet(STORE_KEY, JSON.stringify(state))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [state, ready])

  const api = useMemo<StoreApi>(
    () => ({
      state,
      record: (result) => dispatch({ type: 'record', result }),
      reviewDone: (key, correct) => dispatch({ type: 'reviewDone', key, correct }),
      setStars: (module, levelKey, stars) =>
        dispatch({ type: 'setStars', module, levelKey, stars }),
      setTheme: (theme) => dispatch({ type: 'setTheme', theme }),
      setAi: (ai) => dispatch({ type: 'setAi', ai }),
      setGoal: (goal) => dispatch({ type: 'setGoal', goal }),
      vocabGrade: (wordId, grade) => dispatch({ type: 'vocabGrade', wordId, grade }),
      addReview: (wrong) => dispatch({ type: 'addReview', wrong }),
      removeReview: (key) => dispatch({ type: 'removeReview', key }),
      reset: () => dispatch({ type: 'reset' }),
      importProgress: (next) => dispatch({ type: 'hydrate', state: next }),
      dueReviews: () => state.review.filter((c) => c.due <= Date.now()),
      completePlacement: (level, baselines) =>
        dispatch({ type: 'completePlacement', level, baselines }),
      resetPlacement: () => dispatch({ type: 'resetPlacement' }),
      dismissPlacementBanner: () => dispatch({ type: 'dismissPlacementBanner' }),
      useMakeup: () => dispatch({ type: 'useMakeup' }),
      setCoach: (text, date) => dispatch({ type: 'setCoach', text, date }),
      sprintStart: () => dispatch({ type: 'sprintStart' }),
      sprintCompleteTask: (taskId, day, opts) =>
        dispatch({ type: 'sprintCompleteTask', taskId, day, ...opts }),
      sprintSetTaskIndex: (day, index) => dispatch({ type: 'sprintSetTaskIndex', day, index }),
      sprintSetDayNote: (day, note) => dispatch({ type: 'sprintSetDayNote', day, note }),
      sprintFinishDay: (day, stats) => dispatch({ type: 'sprintFinishDay', day, stats }),
      sprintReset: () => dispatch({ type: 'sprintReset' }),
    }),
    [state],
  )

  if (!ready) {
    return (
      <div className="app-boot" role="status" aria-live="polite">
        <div className="app-boot-card">
          <div className="app-boot-title">六级陪练</div>
          <p className="app-boot-hint">正在加载学习记录…</p>
        </div>
      </div>
    )
  }

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
