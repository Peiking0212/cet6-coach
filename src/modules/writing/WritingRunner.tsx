import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { WritingItem } from '@/data/types'
import type { BatchContext } from '@/engine/practiceAll'
import { batchExitLabel, isBatchActive } from '@/engine/practiceAll'
import { useStore } from '@/store/StoreProvider'
import { Markdown } from '@/components/Markdown'
import { aiConfigured, AiError, chatStream } from '@/ai/client'
import { gradeWritingPrompt } from '@/ai/prompts'

function countWords(s: string): number {
  const m = s.trim().match(/[A-Za-z0-9'-]+/g)
  return m ? m.length : 0
}

export function WritingRunner({
  item,
  onExit,
  batch,
}: {
  item: WritingItem
  onExit: () => void
  batch?: BatchContext
}) {
  const { state, record, setStars } = useStore()
  const [essay, setEssay] = useState('')
  const [feedback, setFeedback] = useState('')
  const [grading, setGrading] = useState(false)
  const [error, setError] = useState('')
  const [showSample, setShowSample] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const words = countWords(essay)
  const configured = aiConfigured(state.ai)

  const markDone = () => {
    if (recorded) return
    record({
      module: 'writing',
      refId: item.id,
      refTitle: item.title,
      correct: 1,
      total: 1,
      timeMs: 0,
      wrong: [],
      selfGraded: true,
    })
    setStars('writing', item.id, 3)
    setRecorded(true)
  }

  const grade = async () => {
    if (words < 10) {
      setError('先写够内容再批改哦（至少 10 个词）。')
      return
    }
    setGrading(true)
    setError('')
    setFeedback('')
    try {
      await chatStream(state.ai, gradeWritingPrompt(item.prompt, item.rubric, essay), (d) =>
        setFeedback((t) => t + d),
      )
      markDone()
    } catch (e) {
      setError(e instanceof AiError ? e.message : '批改失败，请稍后再试。')
    } finally {
      setGrading(false)
    }
  }

  return (
    <div className="runner">
      <div className="runner-head">
        <button className="btn btn-ghost runner-back" onClick={onExit}>
          ← 返回
        </button>
        <div className="runner-title">{item.title}</div>
      </div>

      <div className="card writing-prompt">
        <div className="wp-label">题目</div>
        <p>{item.prompt}</p>
        {item.outline && (
          <details className="wp-outline">
            <summary>写作提纲提示</summary>
            <ul>
              {item.outline.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </details>
        )}
        <div className="wp-rubric">
          {item.rubric.map((r) => (
            <span key={r.name} className="pill" title={r.desc}>
              {r.name} {r.weight}
            </span>
          ))}
        </div>
      </div>

      <div className="card writing-editor">
        <textarea
          value={essay}
          placeholder="在此撰写你的作文…"
          onChange={(e) => setEssay(e.target.value)}
          rows={10}
        />
        <div className={`word-count${words < item.minWords ? ' low' : words > item.maxWords ? ' high' : ' ok'}`}>
          {words} 词（建议 {item.minWords}–{item.maxWords}）
        </div>
      </div>

      <div className="writing-actions">
        {configured ? (
          <button className="btn btn-primary" onClick={grade} disabled={grading}>
            {grading ? 'AI 批改中…' : '✨ AI 批改'}
          </button>
        ) : (
          <span className="ai-explain-hint">
            想要 AI 批改？先到 <Link to="/settings">设置</Link> 配置 API Key。
          </span>
        )}
        <button className="btn" onClick={() => setShowSample((s) => !s)}>
          {showSample ? '隐藏范文' : '查看范文'}
        </button>
        {!recorded && (
          <button className="btn btn-ghost" onClick={markDone}>
            标记完成
          </button>
        )}
      </div>

      {error && <div className="ai-error">{error}</div>}

      {feedback && (
        <div className="card writing-feedback fade-in">
          <div className="wp-label">AI 批改</div>
          <Markdown text={feedback} />
        </div>
      )}

      {showSample && (
        <div className="card writing-sample fade-in">
          <div className="wp-label">参考范文</div>
          {item.sample.split('\n').map((p, i) =>
            p.trim() ? <p key={i}>{p}</p> : <br key={i} />,
          )}
        </div>
      )}

      {recorded && (
        <div className="writing-done">
          已记录完成 ✓{' '}
          {isBatchActive(batch) ? (
            <button className="btn btn-primary" onClick={onExit}>
              {batchExitLabel(batch)}
            </button>
          ) : (
            '继续保持！'
          )}
        </div>
      )}
    </div>
  )
}
