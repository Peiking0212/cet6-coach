import { useState } from 'react'
import { useStore } from '@/store/StoreProvider'
import { aiConfigured, AiError, chatStream } from '@/ai/client'
import { vocabHelpPrompt } from '@/ai/prompts'
import { Markdown } from '@/components/Markdown'
import type { VocabWord } from '@/data/types'

export function VocabAiHelper({ word }: { word: VocabWord }) {
  const { state } = useStore()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!aiConfigured(state.ai)) return null

  const run = async () => {
    setLoading(true)
    setError('')
    setText('')
    try {
      await chatStream(state.ai, vocabHelpPrompt(word), (d) => setText((t) => t + d))
    } catch (e) {
      setError(e instanceof AiError ? e.message : '生成失败，请稍后再试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-explain">
      {!text && !loading && (
        <button className="btn btn-ghost vocab-ai-btn" onClick={run}>
          ✨ AI 生成助记
        </button>
      )}
      {loading && !text && <div className="ai-loading">AI 正在生成…</div>}
      {text && (
        <div className="ai-explain-box">
          <Markdown text={text} />
        </div>
      )}
      {error && <div className="ai-error">{error}</div>}
    </div>
  )
}
