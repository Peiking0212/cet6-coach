import { useEffect, useMemo, useState } from 'react'

import { useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'

import { Stars } from '@/components/Stars'

import { PracticeAllBanner } from '@/components/PracticeAllBanner'

import { ItemQueueShell } from '@/components/ItemQueueShell'

import { writingBank } from '@/data'
import { filterWriting } from '@/data/exams'
import { ExamSetPicker, loadExamSetFilter } from '@/components/ExamSetPicker'
import type { ExamSetFilter } from '@/data/types'

import { moduleCounts, shuffleItems } from '@/engine/practiceAll'

import { useStore } from '@/store/StoreProvider'

import { moduleDifficulty, sortByTargetDifficulty } from '@/store/adaptive'

import type { WritingItem } from '@/data/types'

import { WritingRunner } from './WritingRunner'



export function WritingPage() {

  const { state } = useStore()

  const [params] = useSearchParams()

  const [queue, setQueue] = useState<WritingItem[] | null>(null)

  const [queueIdx, setQueueIdx] = useState(0)

  const [shuffled, setShuffled] = useState(false)

  const [examFilter, setExamFilter] = useState<ExamSetFilter>(loadExamSetFilter)

  const bank = useMemo(() => filterWriting(writingBank, examFilter), [examFilter])

  const sorted = useMemo(

    () => sortByTargetDifficulty(bank, moduleDifficulty(state, 'writing')),

    [state, bank],

  )



  const activeItem = queue ? queue[queueIdx] ?? null : null

  const countsInfo = moduleCounts().writing



  const startQueue = (items: WritingItem[]) => {

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

      <ItemQueueShell batch={batch} moduleLabel="作文">

        <WritingRunner

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



  return (

    <div>

      <PageHeader title="作文" subtitle="写作 + 评分维度 + AI 批改 + 范文 · 全部练一遍" />

      <ExamSetPicker value={examFilter} onChange={setExamFilter} />

      <PracticeAllBanner

        label="作文 · 全部题目"

        count={countsInfo}

        detail="道"

        shuffled={shuffled}

        onToggleShuffle={() => setShuffled((s) => !s)}

        onStart={() => startQueue(sorted)}

      />



      <div className="level-list">

        {sorted.map((item) => {

          const stars = state.progress.writing.stars[item.id] ?? 0

          return (

            <button

              key={item.id}

              className="level-item card"

              onClick={() => {

                setQueue([item])

                setQueueIdx(0)

              }}

            >

              <div className="kind-badge writing">作文</div>

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


