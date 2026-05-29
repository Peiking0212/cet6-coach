import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/StoreProvider'
import { aiConfigured, AiError, chatStream } from '@/ai/client'
import { explainPrompt } from '@/ai/prompts'
import type { WrongItem } from '@/engine/types'
import { Markdown } from './Markdown'

export function AiExplain({ wrong }: { wrong: WrongItem }) {
  const { state } = useStore()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const configured = aiConfigured(state.ai)

  const run = async () => {
    setLoading(true)
    setError('')
    setText('')
    try {
      await chatStream(state.ai, explainPrompt(wrong), (d) => setText((t) => t + d))
    } catch (e) {
      setError(e instanceof AiError ? e.message : '讲解失败，请稍后再试。')
    } finally {
      setLoading(false)
    }
  }

  if (!configured) {
    return (
      <div className="ai-explain-hint">
        想要 AI 讲解？先到 <Link to="/settings">设置</Link> 配置 API Key。
      </div>
    )
  }

  return (
    <div className="ai-explain">
      {!text && !loading && (
        <button className="btn btn-primary ai-explain-btn" onClick={run}>
          ✨ AI 讲解这道题
        </button>
      )}
      {loading && !text && <div className="ai-loading">AI 正在思考…</div>}
      {text && (
        <div className="ai-explain-box">
          <Markdown text={text} />
          {!loading && (
            <button className="btn btn-ghost ai-regen" onClick={run}>
              重新讲解
            </button>
          )}
        </div>
      )}
      {error && <div className="ai-error">{error}</div>}
    </div>
  )
}
