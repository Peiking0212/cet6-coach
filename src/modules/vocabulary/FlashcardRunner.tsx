import { useMemo, useState } from 'react'
import type { VocabWord } from '@/data/types'
import type { WrongItem } from '@/engine/types'
import { useStore } from '@/store/StoreProvider'
import type { VocabGrade } from '@/store/types'
import { useTimer } from '@/engine/useTimer'
import { useSpeaker } from '@/engine/useSpeaker'
import { QuizBar } from '@/components/QuizBar'
import { ResultSummary } from '@/components/ResultSummary'
import { VocabAiHelper } from './VocabAiHelper'
import { VocabMemoryAids } from './VocabMemoryAids'
import { shuffle, wordWrong } from './vocab'
import { IconPlay } from '@/app/icons'

export function FlashcardRunner({
  words,
  deckId,
  deckLabel,
  onExit,
}: {
  words: VocabWord[]
  deckId: string
  deckLabel: string
  onExit: () => void
}) {
  const { record, setStars, vocabGrade, addReview } = useStore()
  const deck = useMemo(() => shuffle(words), [words])
  const speaker = useSpeaker()
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const { ms } = useTimer(!done)
  const agg = useMemo(() => ({ known: 0, wrong: [] as WrongItem[], marked: new Set<string>() }), [])

  const w = deck[i]

  const rate = (grade: VocabGrade) => {
    vocabGrade(w.id, grade)
    if (grade === 'know') agg.known += 1
    else if (grade === 'unknown') agg.wrong.push(wordWrong(w, '不认识'))

    if (i + 1 < deck.length) {
      setI(i + 1)
      setFlipped(false)
    } else {
      const total = deck.length
      const ratio = agg.known / total
      const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1
      record({
        module: 'vocabulary',
        refId: deckId,
        refTitle: `单词卡片 · ${deckLabel}`,
        level: 'flashcard',
        correct: agg.known,
        total,
        timeMs: ms,
        wrong: agg.wrong,
        selfGraded: true,
      })
      setStars('vocabulary', deckId, stars)
      speaker.stop()
      setDone(true)
    }
  }

  const mark = () => {
    if (agg.marked.has(w.id)) return
    agg.marked.add(w.id)
    addReview(wordWrong(w, '已加入复习'))
  }

  if (done) {
    const total = deck.length
    const ratio = agg.known / total
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1
    return (
      <div className="runner">
        <ResultSummary
          correct={agg.known}
          total={total}
          timeMs={ms}
          stars={stars}
          onExit={onExit}
        />
      </div>
    )
  }

  return (
    <div className="runner">
      <div className="runner-head">
        <button
          className="btn btn-ghost runner-back"
          onClick={() => {
            speaker.stop()
            onExit()
          }}
        >
          ← 返回
        </button>
        <div className="runner-title">单词卡片 · {deckLabel}</div>
      </div>

      <QuizBar index={i} total={deck.length} timeMs={ms} combo={0} />

      <div className={`flashcard${flipped ? ' flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
        <div className="flashcard-inner">
          <div className="flashcard-face front">
            <div className="fc-word">{w.word}</div>
            <div className="fc-phonetic">{w.phonetic}</div>
            <button
              className="fc-speak"
              onClick={(e) => {
                e.stopPropagation()
                speaker.speak(w.word)
              }}
              aria-label="朗读单词"
            >
              <IconPlay size={18} /> 发音
            </button>
            <div className="fc-hint">点击卡片查看释义</div>
          </div>
          <div className="flashcard-face back">
            <div className="fc-pos">{w.pos}</div>
            <div className="fc-meaning">{w.meaning}</div>
            <div className="fc-example">{w.example}</div>
            <div className="fc-example-cn">{w.exampleCn}</div>
            {w.synonyms && w.synonyms.length > 0 && (
              <div className="fc-syn">近义：{w.synonyms.join('、')}</div>
            )}
            <VocabMemoryAids word={w} />
          </div>
        </div>
      </div>

      {flipped && (
        <div className="fc-extra fade-in">
          <button className={`btn btn-ghost fc-mark${agg.marked.has(w.id) ? ' marked' : ''}`} onClick={mark}>
            {agg.marked.has(w.id) ? '已加入复习 ✓' : '★ 标记复习'}
          </button>
          <VocabAiHelper word={w} />
        </div>
      )}

      {!flipped ? (
        <button className="btn btn-primary fc-reveal" onClick={() => setFlipped(true)}>
          查看释义
        </button>
      ) : (
        <div className="fc-actions fc-actions-3 fade-in">
          <button className="btn fc-unknown" onClick={() => rate('unknown')}>
            不认识
          </button>
          <button className="btn fc-fuzzy" onClick={() => rate('fuzzy')}>
            模糊
          </button>
          <button className="btn btn-primary fc-known" onClick={() => rate('know')}>
            认识 ✓
          </button>
        </div>
      )}
    </div>
  )
}
