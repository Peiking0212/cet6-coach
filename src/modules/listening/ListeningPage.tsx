import { useEffect, useMemo, useState } from 'react'

import { useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'

import { Stars } from '@/components/Stars'

import { PracticeAllBanner } from '@/components/PracticeAllBanner'

import { ItemQueueShell } from '@/components/ItemQueueShell'

import { listeningBank } from '@/data'
import { filterListening } from '@/data/exams'
import { ExamSetPicker, loadExamSetFilter } from '@/components/ExamSetPicker'
import type { ExamSetFilter } from '@/data/types'

import { moduleCounts, shuffleItems } from '@/engine/practiceAll'

import { useStore } from '@/store/StoreProvider'

import { moduleDifficulty, sortByTargetDifficulty } from '@/store/adaptive'

import type { ListeningItem } from '@/data/types'

import { ListeningRunner } from './ListeningRunner'



const KIND_LABEL: Record<ListeningItem['kind'], string> = {

  news: '短新闻',

  dialogue: '长对话',

  lecture: '讲座/讲话',

}



const KIND_ORDER: ListeningItem['kind'][] = ['news', 'dialogue', 'lecture']

const ALL = 'all' as const

type FilterKind = typeof ALL | ListeningItem['kind']



export function ListeningPage() {

  const { state } = useStore()

  const [params] = useSearchParams()

  const [filter, setFilter] = useState<FilterKind>(ALL)

  const [queue, setQueue] = useState<ListeningItem[] | null>(null)

  const [queueIdx, setQueueIdx] = useState(0)

  const [shuffled, setShuffled] = useState(false)

  const [examFilter, setExamFilter] = useState<ExamSetFilter>(loadExamSetFilter)

  const bank = useMemo(
    () => filterListening(listeningBank, examFilter),
    [examFilter],
  )

  const sorted = useMemo(

    () => sortByTargetDifficulty(bank, moduleDifficulty(state, 'listening')),

    [state, bank],

  )



  const counts = useMemo(() => {

    const map = { news: 0, dialogue: 0, lecture: 0 }

    for (const item of bank) map[item.kind] += 1

    return map

  }, [bank])



  const filtered = useMemo(

    () => (filter === ALL ? sorted : sorted.filter((i) => i.kind === filter)),

    [filter, sorted],

  )



  const activeItem = queue ? queue[queueIdx] ?? null : null

  const countsInfo = moduleCounts().listening



  const startQueue = (items: ListeningItem[]) => {

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

      <ItemQueueShell batch={batch} moduleLabel="听力">

        <ListeningRunner

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

      </ItemQueueShell>

    )

  }



  const startPracticeAll = (kind: ListeningItem['kind']) => {

    startQueue(sorted.filter((i) => i.kind === kind))

    setFilter(kind)

  }



  return (

    <div>

      <PageHeader title="听力" subtitle="短新闻 · 长对话 · 讲座 · 真题录音 / TTS" />

      <ExamSetPicker value={examFilter} onChange={setExamFilter} />

      <PracticeAllBanner

        label="听力 · 全部题型"

        count={countsInfo}

        shuffled={shuffled}

        onToggleShuffle={() => setShuffled((s) => !s)}

        onStart={() => startQueue(sorted)}

      />



      <div className="reading-type-grid">

        {KIND_ORDER.map((kind) => (

          <div key={kind} className="reading-type-card card">

            <div className={`kind-badge ${kind}`}>{KIND_LABEL[kind].slice(0, 2)}</div>

            <div className="reading-type-main">

              <div className="reading-type-name">{KIND_LABEL[kind]}</div>

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

        {KIND_ORDER.map((kind) => (

          <button

            key={kind}

            className={`deck-chip${filter === kind ? ' active' : ''}`}

            onClick={() => setFilter(kind)}

          >

            {KIND_LABEL[kind]} {counts[kind]}

          </button>

        ))}

      </div>



      <div className="level-list">

        {filtered.map((item) => {

          const stars = state.progress.listening.stars[item.id] ?? 0

          return (

            <button

              key={item.id}

              className="level-item card"

              onClick={() => {

                setQueue([item])

                setQueueIdx(0)

              }}

            >

              <div className={`kind-badge ${item.kind}`}>{KIND_LABEL[item.kind].slice(0, 2)}</div>

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


