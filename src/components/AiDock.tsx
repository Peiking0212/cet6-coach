import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '@/store/StoreProvider'
import { aiConfigured, AiError, chatStream, type ChatMessage } from '@/ai/client'
import { dockSystemPrompt, type PageContext } from '@/ai/dockPrompt'
import { Markdown } from '@/components/Markdown'
import { MODULE_LABELS, type ModuleType } from '@/data/types'

const DOCK_KEY = 'cet6-coach-dock-chat'

const PATH_MODULE: Record<string, ModuleType | undefined> = {
  '/vocabulary': 'vocabulary',
  '/listening': 'listening',
  '/translation': 'translation',
  '/reading': 'reading',
  '/writing': 'writing',
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(DOCK_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatMessage[]
    return Array.isArray(parsed) ? parsed.filter((m) => m.role !== 'system') : []
  } catch {
    return []
  }
}

function saveMessages(msgs: ChatMessage[]) {
  try {
    sessionStorage.setItem(DOCK_KEY, JSON.stringify(msgs))
  } catch {
    /* ignore */
  }
}

export function AiDock() {
  const { state } = useStore()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const configured = aiConfigured(state.ai)

  const ctx: PageContext = {
    path: loc.pathname,
    module: PATH_MODULE[loc.pathname] ? MODULE_LABELS[PATH_MODULE[loc.pathname]!] : undefined,
  }

  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  const scrollDown = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
    })
  }

  const send = async (text: string) => {
    if (!text.trim() || busy || !configured) return
    setError('')
    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const next = [...messages, userMsg]
    setMessages([...next, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    scrollDown()
    try {
      await chatStream(
        state.ai,
        [dockSystemPrompt(ctx), ...next],
        (d) => {
          setMessages((m) => {
            const copy = [...m]
            copy[copy.length - 1] = {
              role: 'assistant',
              content: copy[copy.length - 1].content + d,
            }
            return copy
          })
          scrollDown()
        },
      )
    } catch (e) {
      setError(e instanceof AiError ? e.message : '出错了')
      setMessages((m) => m.slice(0, -1))
    } finally {
      setBusy(false)
    }
  }

  const clear = () => {
    setMessages([])
    sessionStorage.removeItem(DOCK_KEY)
  }

  return (
    <>
      <button
        type="button"
        className="ai-dock-fab"
        aria-label="AI 陪学"
        onClick={() => setOpen((o) => !o)}
      >
        💬
      </button>

      {open && (
        <div className="ai-dock-panel card" role="dialog" aria-label="AI 陪学聊天">
          <div className="ai-dock-head">
            <strong>陪学教练</strong>
            <div className="ai-dock-actions">
              {messages.length > 0 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
                  清空
                </button>
              )}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                收起
              </button>
            </div>
          </div>

          {!configured ? (
            <div className="ai-dock-empty">
              <p>去设置填写 API Key 后即可边练边问。</p>
              <Link to="/settings" className="btn btn-primary" onClick={() => setOpen(false)}>
                去设置
              </Link>
            </div>
          ) : (
            <>
              <div className="ai-dock-list" ref={listRef}>
                {messages.length === 0 && (
                  <p className="ai-dock-welcome">
                    我在呢～可以问词汇、语法、阅读技巧，或正在做的题。
                  </p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`bubble ${m.role}`}>
                    {m.role === 'assistant' ? (
                      m.content ? (
                        <Markdown text={m.content} />
                      ) : (
                        <span className="typing">…</span>
                      )
                    ) : (
                      m.content
                    )}
                  </div>
                ))}
                {error && <div className="ai-error">{error}</div>}
              </div>
              <form
                className="ai-dock-input"
                onSubmit={(e) => {
                  e.preventDefault()
                  send(input)
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="问六级相关问题…"
                  disabled={busy}
                />
                <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
                  发送
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}
