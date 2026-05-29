import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

type EncourageKind = 'correct' | 'combo' | 'goal' | 'levelup'

interface Toast {
  id: number
  kind: EncourageKind
  text: string
}

const MESSAGES: Record<EncourageKind, string[]> = {
  correct: ['太棒了！', '答对了～', 'Nice!', '保持状态！', '稳稳的 ✓'],
  combo: ['连击升温！', '手感来了！', '火力全开！'],
  goal: ['今日目标达成！', '打卡完成，超赞！'],
  levelup: ['等级提升！', '又升一级啦！'],
}

const EncourageContext = createContext<{
  cheer: (kind: EncourageKind, text?: string) => void
  onCorrect: (combo: number) => void
} | null>(null)

let nextId = 0

export function EncourageProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const cheer = useCallback((kind: EncourageKind, text?: string) => {
    const pool = MESSAGES[kind]
    const msg = text ?? pool[Math.floor(Math.random() * pool.length)]
    const id = ++nextId
    setToasts((t) => [...t.slice(-2), { id, kind, text: msg }])
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 2200)
  }, [])

  const onCorrect = useCallback(
    (combo: number) => {
      cheer('correct')
      if (combo > 0 && combo % 5 === 0) cheer('combo', `🔥 ${combo} 连击！`)
    },
    [cheer],
  )

  return (
    <EncourageContext.Provider value={{ cheer, onCorrect }}>
      {children}
      <div className="encourage-layer" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`encourage-toast encourage-${t.kind} pop-in`}>
            {t.text}
          </div>
        ))}
      </div>
    </EncourageContext.Provider>
  )
}

export function useEncourage() {
  const ctx = useContext(EncourageContext)
  if (!ctx) throw new Error('useEncourage must be used within EncourageProvider')
  return ctx
}
