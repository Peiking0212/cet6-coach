import { useEffect, useMemo, useState } from 'react'

import { useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'

import { Stars } from '@/components/Stars'

import { PracticeAllBanner } from '@/components/PracticeAllBanner'

import { ItemQueueShell } from '@/components/ItemQueueShell'

import { translationBank } from '@/data'
import { filterTranslation } from '@/data/exams'
import { ExamSetPicker, loadExamSetFilter } from '@/components/ExamSetPicker'
import type { ExamSetFilter } from '@/data/types'

import { moduleCounts, shuffleItems } from '@/engine/practiceAll'

import { useStore } from '@/store/StoreProvider'

import { moduleDifficulty, sortByTargetDifficulty } from '@/store/adaptive'

import type { TranslationItem } from '@/data/types'

import { TranslationRunner } from './TranslationRunner'



export function TranslationPage() {

  const { state } = useStore()

  const [params] = useSearchParams()

  const [queue, setQueue] = useState<TranslationItem[] | null>(null)

  const [queueIdx, setQueueIdx] = useState(0)

  const [shuffled, setShuffled] = useState(false)

  const [examFilter, setExamFilter] = useState<ExamSetFilter>(loadExamSetFilter)

  const bank = useMemo(() => filterTranslation(translationBank, examFilter), [examFilter])

  const sorted = useMemo(

    () => sortByTargetDifficulty(bank, moduleDifficulty(state, 'translation')),

    [state, bank],

  )



  const activeItem = queue ? queue[queueIdx] ?? null : null

  const countsInfo = moduleCounts().translation



  const startQueue = (items: TranslationItem[]) => {

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

      <ItemQueueShell batch={batch} moduleLabel="翻译">

        <TranslationRunner

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

      <PageHeader title="翻译" subtitle="三关进阶：重点词填空 → 整句翻译 → 全文翻译" />

      <ExamSetPicker value={examFilter} onChange={setExamFilter} />

      <PracticeAllBanner

        label="翻译 · 全部篇章"

        count={countsInfo}

        detail="篇"

        shuffled={shuffled}

        onToggleShuffle={() => setShuffled((s) => !s)}

        onStart={() => startQueue(sorted)}

      />



      <div className="level-list">

        {sorted.map((item, i) => {

          const stars = state.progress.translation.stars[item.id] ?? 0

          return (

            <button

              key={item.id}

              className="level-item card"

              onClick={() => {

                setQueue([item])

                setQueueIdx(0)

              }}

            >

              <div className="level-no">第 {i + 1} 关</div>

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


