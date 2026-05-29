import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/StoreProvider'
import { PageHeader } from '@/components/PageHeader'
import { Markdown } from '@/components/Markdown'
import { aiConfigured, AiError, chatStream, type ChatMessage } from '@/ai/client'
import { chatSystemPrompt } from '@/ai/prompts'

const QUICK = [
  '帮我讲讲虚拟语气怎么用',
  '六级作文怎么写开头更高级？',
  '用英文和我聊聊我的周末',
  '出 5 个六级高频词并造句',
]

export function ChatPage() {
  const { state } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const configured = aiConfigured(state.ai)

  const scrollDown = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
    })
  }

  const send = async (text: string) => {
    if (!text.trim() || busy) return
    setError('')
    const next: ChatMessage[] = [...messages, { role: 'user', content: text.trim() }]
    setMessages([...next, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    scrollDown()
    try {
      await chatStream(state.ai, [chatSystemPrompt(), ...next], (d) => {
        setMessages((m) => {
          const copy = [...m]
          copy[copy.length - 1] = {
            role: 'assistant',
            content: copy[copy.length - 1].content + d,
          }
          return copy
        })
        scrollDown()
      })
    } catch (e) {
      setError(e instanceof AiError ? e.message : '出错了，请稍后再试。')
      setMessages((m) => m.slice(0, -1))
    } finally {
      setBusy(false)
    }
  }

  if (!configured) {
    return (
      <div>
        <PageHeader title="AI 答疑陪聊" subtitle="语法、词汇、口语练习随便问" />
        <div className="empty card">
          <div className="empty-emoji">🤖</div>
          <p>还没配置 AI 助手</p>
          <p className="empty-sub">到设置里填好 baseURL、API Key 和模型即可开始对话。</p>
          <Link to="/settings" className="btn btn-primary" style={{ marginTop: 16 }}>
            去设置
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-page">
      <PageHeader title="AI 答疑陪聊" subtitle="语法、词汇、口语练习随便问" />
      <div className="chat-list" ref={listRef}>
        {messages.length === 0 && (
          <div className="chat-welcome">
            <p>你好！我是你的六级学习助教，问我任何问题吧。</p>
            <div className="chat-quick">
              {QUICK.map((q) => (
                <button key={q} className="chip-btn" onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.role === 'assistant' ? (
              m.content ? (
                <Markdown text={m.content} />
              ) : (
                <span className="typing">正在输入…</span>
              )
            ) : (
              m.content
            )}
          </div>
        ))}
        {error && <div className="ai-error">{error}</div>}
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题…"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
          发送
        </button>
      </form>
    </div>
  )
}
