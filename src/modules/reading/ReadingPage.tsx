import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Stars } from '@/components/Stars'
import { PracticeAllBanner } from '@/components/PracticeAllBanner'
import { readingBank } from '@/data'
import { filterReading } from '@/data/exams'
import { ExamSetPicker, loadExamSetFilter } from '@/components/ExamSetPicker'
import type { ExamSetFilter } from '@/data/types'
import { moduleCounts, shuffleItems } from '@/engine/practiceAll'
import { useStore } from '@/store/StoreProvider'
import { moduleDifficulty, sortByTargetDifficulty } from '@/store/adaptive'
import type { ReadingItem, ReadingKind } from '@/data/types'
import {
  READING_KIND_LABELS,
  READING_KIND_ORDER,
  READING_KIND_SHORT,
} from './labels'
import { ReadingRunner } from './ReadingRunner'

const ALL = 'all' as const
type FilterKind = typeof ALL | ReadingKind

export function ReadingPage() {
  const { state } = useStore()
  const [params] = useSearchParams()
  const [filter, setFilter] = useState<FilterKind>(ALL)
  const [queue, setQueue] = useState<ReadingItem[] | null>(null)
  const [queueIdx, setQueueIdx] = useState(0)
  const [shuffled, setShuffled] = useState(false)
  const [examFilter, setExamFilter] = useState<ExamSetFilter>(loadExamSetFilter)

  const bank = useMemo(() => filterReading(readingBank, examFilter), [examFilter])

  const diff = moduleDifficulty(state, 'reading')
  const sorted = useMemo(
    () => sortByTargetDifficulty(bank, diff),
    [diff, bank],
  )

  const counts = useMemo(() => {
    const map = Object.fromEntries(READING_KIND_ORDER.map((k) => [k, 0])) as Record<
      ReadingKind,
      number
    >
    for (const item of bank) map[item.kind] += 1
    return map
  }, [bank])

  const filtered = useMemo(
    () => (filter === ALL ? sorted : sorted.filter((i) => i.kind === filter)),
    [filter, sorted],
  )

  const activeItem = queue ? queue[queueIdx] ?? null : null
  const countsInfo = moduleCounts().reading

  const startQueue = (items: ReadingItem[]) => {
    if (!items.length) return
    setQueue(shuffleItems(items, shuffled))
    setQueueIdx(0)
  }

  useEffect(() => {
    if (params.get('practiceAll') === '1' && !queue) startQueue(sorted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  if (activeItem && queue) {
    const batch =
      queue.length > 1
        ? { index: queueIdx, total: queue.length, onNext: () => setQueueIdx(queueIdx + 1) }
        : undefined
    return (
      <ReadingRunner
        item={activeItem}
        batch={batch}
        onExit={() => {
          if (queueIdx + 1 < queue.length) setQueueIdx(queueIdx + 1)
          else {
            setQueue(null)
            setQueueIdx(0)
          }
        }}
      />
    )
  }

  const startPracticeAll = (kind: ReadingKind) => {
    startQueue(sorted.filter((i) => i.kind === kind))
    setFilter(kind)
  }

  return (
    <div>
      <PageHeader
        title="阅读"
        subtitle="选词填空 · 长篇匹配 · 仔细阅读 · 完形填空 · 七选五"
      />

      <ExamSetPicker value={examFilter} onChange={setExamFilter} />

      <PracticeAllBanner
        label="阅读 · 全部题型"
        count={countsInfo}
        shuffled={shuffled}
        onToggleShuffle={() => setShuffled((s) => !s)}
        onStart={() => startQueue(sorted)}
      />

      <div className="reading-type-grid">
        {READING_KIND_ORDER.map((kind) => (
          <div key={kind} className="reading-type-card card">
            <div className={`kind-badge ${kind}`}>{READING_KIND_SHORT[kind]}</div>
            <div className="reading-type-main">
              <div className="reading-type-name">{READING_KIND_LABELS[kind]}</div>
              <div className="reading-type-count">{counts[kind]} 套</div>
            </div>
            <button
              className="btn btn-ghost reading-type-all"
              disabled={counts[kind] === 0}
              onClick={() => startPracticeAll(kind)}
            >
              全部练习
            </button>
          </div>
        ))}
      </div>

      <div className="deck-row reading-filter-row">
        <button
          className={`deck-chip${filter === ALL ? ' active' : ''}`}
          onClick={() => setFilter(ALL)}
        >
          全部 {bank.length}
        </button>
        {READING_KIND_ORDER.map((kind) => (
          <button
            key={kind}
            className={`deck-chip${filter === kind ? ' active' : ''}`}
            onClick={() => setFilter(kind)}
          >
            {READING_KIND_SHORT[kind]} {counts[kind]}
          </button>
        ))}
      </div>

      <div className="level-list">
        {filtered.map((item) => {
          const stars = state.progress.reading.stars[item.id] ?? 0
          return (
            <button
              key={item.id}
              className="level-item card"
              onClick={() => {
                setQueue([item])
                setQueueIdx(0)
              }}
            >
              <div className={`kind-badge ${item.kind}`}>{READING_KIND_SHORT[item.kind]}</div>
              <div className="level-main">
                <div className="level-name">{item.title}</div>
                <div className="level-tags">
                  {item.category && <span className="pill">{item.category}</span>}
                  {item.examSet && <span className="pill exam-pill">真题</span>}
                  <span className="diff">难度 {'★'.repeat(item.difficulty)}</span>
                </div>
              </div>
              <Stars value={stars} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
