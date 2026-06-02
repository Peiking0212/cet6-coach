import { EXAM_SETS } from '@/data/exams'
import type { ExamSetFilter } from '@/data/types'
import { EXAM_SET_FILTER_KEY, storageGetSync, storageSet } from '@/lib/appStorage'

function parseFilter(v: string | null): ExamSetFilter {
  if (v && (v === 'all' || v === 'builtin' || EXAM_SETS.some((s) => s.id === v))) {
    return v
  }
  return 'all'
}

export function loadExamSetFilter(): ExamSetFilter {
  return parseFilter(storageGetSync(EXAM_SET_FILTER_KEY))
}

export function saveExamSetFilter(filter: ExamSetFilter) {
  void storageSet(EXAM_SET_FILTER_KEY, filter)
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
