import type { AiConfig } from '@/store/types'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export class AiError extends Error {}

export function aiConfigured(cfg: AiConfig): boolean {
  return Boolean(cfg.baseURL && cfg.apiKey && cfg.model)
}

function endpoint(cfg: AiConfig): string {
  let base = cfg.baseURL.trim().replace(/\/$/, '')
  // accept either a bare host or a full .../v1
  if (!/\/v\d+$/.test(base) && !base.endsWith('/chat/completions')) {
    base = base + '/v1'
  }
  const url = base.endsWith('/chat/completions') ? base : base + '/chat/completions'
  if (cfg.proxyURL.trim()) {
    const proxy = cfg.proxyURL.trim().replace(/\/$/, '')
    return `${proxy}/proxy?url=${encodeURIComponent(url)}`
  }
  return url
}

/** Non-streaming completion. Returns full text. */
export async function chat(
  cfg: AiConfig,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  if (!aiConfigured(cfg)) {
    throw new AiError('尚未配置 AI：请到「设置」填写 baseURL、API Key 与模型。')
  }
  let res: Response
  try {
    res = await fetch(endpoint(cfg), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: cfg.temperature,
        stream: false,
      }),
      signal,
    })
  } catch {
    throw new AiError(
      '网络请求失败，可能是 CORS 限制。可在设置里填写本地代理地址（见 README 的 proxy 用法）。',
    )
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new AiError(`AI 接口返回 ${res.status}：${text.slice(0, 300)}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new AiError('AI 返回格式异常（缺少 choices[0].message.content）。')
  }
  return content
}

/** Streaming completion via SSE. Calls onDelta for each token chunk. */
export async function chatStream(
  cfg: AiConfig,
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (!aiConfigured(cfg)) {
    throw new AiError('尚未配置 AI：请到「设置」填写 baseURL、API Key 与模型。')
  }
  let res: Response
  try {
    res = await fetch(endpoint(cfg), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: cfg.temperature,
        stream: true,
      }),
      signal,
    })
  } catch {
    throw new AiError(
      '网络请求失败，可能是 CORS 限制。可在设置里填写本地代理地址（见 README 的 proxy 用法）。',
    )
  }
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '')
    throw new AiError(`AI 接口返回 ${res.status}：${text.slice(0, 300)}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload)
        const delta = json?.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta) {
          full += delta
          onDelta(delta)
        }
      } catch {
        /* ignore keep-alive / partial */
      }
    }
  }
  return full
}
