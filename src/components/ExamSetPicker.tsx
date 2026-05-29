import { EXAM_SETS } from '@/data/exams'
import type { ExamSetFilter } from '@/data/types'

const STORAGE_KEY = 'cet6-exam-set-filter'

export function loadExamSetFilter(): ExamSetFilter {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && (v === 'all' || v === 'builtin' || EXAM_SETS.some((s) => s.id === v))) {
      return v
    }
  } catch {
    /* ignore */
  }
  return 'all'
}

export function saveExamSetFilter(filter: ExamSetFilter) {
  try {
    localStorage.setItem(STORAGE_KEY, filter)
  } catch {
    /* ignore */
  }
}

export function ExamSetPicker({
  value,
  onChange,
}: {
  value: ExamSetFilter
  onChange: (v: ExamSetFilter) => void
}) {
  const set = (v: ExamSetFilter) => {
    saveExamSetFilter(v)
    onChange(v)
  }

  return (
    <div className="exam-set-picker">
      <span className="exam-set-label">题库</span>
      <div className="exam-set-options">
        <button
          type="button"
          className={`exam-set-btn${value === 'all' ? ' active' : ''}`}
          onClick={() => set('all')}
        >
          全部
        </button>
        {EXAM_SETS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`exam-set-btn${value === s.id ? ' active' : ''}`}
            onClick={() => set(s.id)}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          className={`exam-set-btn${value === 'builtin' ? ' active' : ''}`}
          onClick={() => set('builtin')}
        >
          内置示例
        </button>
      </div>
    </div>
  )
}
