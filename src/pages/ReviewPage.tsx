import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/StoreProvider'
import { PageHeader } from '@/components/PageHeader'
import { AiExplain } from '@/components/AiExplain'
import { MODULE_LABELS } from '@/data/types'

export function ReviewPage() {
  const { state, reviewDone } = useStore()
  const due = useMemo(
    () => state.review.filter((c) => c.due <= Date.now()).sort((a, b) => a.due - b.due),
    [state.review],
  )
  const [revealed, setRevealed] = useState(false)

  const card = due[0]
  const totalUpcoming = state.review.length

  if (!card) {
    return (
      <div>
        <PageHeader title="错题复习" subtitle="基于间隔重现的复习队列" />
        <div className="empty card">
          <div className="empty-emoji">🎉</div>
          <p>当前没有到期的错题啦！</p>
          {totalUpcoming > 0 ? (
            <p className="empty-sub">还有 {totalUpcoming} 道题在排队，过段时间再来。</p>
          ) : (
            <p className="empty-sub">去各模块练习，答错的题会自动进入复习队列。</p>
          )}
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>
            回到首页
          </Link>
        </div>
      </div>
    )
  }

  const mark = (correct: boolean) => {
    reviewDone(card.wrong.key, correct)
    setRevealed(false)
  }

  return (
    <div>
      <PageHeader title="错题复习" subtitle={`待复习 ${due.length} 题 · 总队列 ${totalUpcoming}`} />

      <div className="review-card card fade-in" key={card.wrong.key}>
        <div className="review-meta">
          <span className="pill">{MODULE_LABELS[card.wrong.module]}</span>
          <span className="review-from">来自《{card.wrong.refTitle}》</span>
        </div>

        <div className="review-q">{card.wrong.question}</div>

        {!revealed ? (
          <button className="btn btn-primary review-reveal" onClick={() => setRevealed(true)}>
            显示答案
          </button>
        ) : (
          <div className="fade-in">
            <div className="review-answers">
              <div className="ans-row wrong">
                <span className="ans-label">你的答案</span>
                <span>{card.wrong.yourAnswer || '（未作答）'}</span>
              </div>
              <div className="ans-row correct">
                <span className="ans-label">正确答案</span>
                <span>{card.wrong.correctAnswer}</span>
              </div>
            </div>
            {card.wrong.explanation && (
              <div className="explanation">
                <div className="explanation-title">解析</div>
                {card.wrong.explanation}
              </div>
            )}
            <AiExplain wrong={card.wrong} />
            <div className="review-actions">
              <button className="btn" onClick={() => mark(false)}>
                还不熟，再练
              </button>
              <button className="btn btn-primary" onClick={() => mark(true)}>
                记住了 ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
