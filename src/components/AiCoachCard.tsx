import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/StoreProvider'
import { aiConfigured } from '@/ai/client'
import { coachTipForToday, fetchCoachTip, ruleBasedCoachTip } from '@/ai/coach'
import { todayStr } from '@/store/defaults'

export function AiCoachCard() {
  const { state, setCoach } = useStore()
  const [text, setText] = useState(coachTipForToday(state) ?? '')
  const [loading, setLoading] = useState(false)
  const configured = aiConfigured(state.ai)
  const today = todayStr()

  const load = async (force = false) => {
    if (!force && coachTipForToday(state)) {
      setText(state.coach.text)
      return
    }
    setLoading(true)
    try {
      const tip = configured
        ? await fetchCoachTip(state.ai, state)
        : ruleBasedCoachTip(state)
      setText(tip)
      setCoach(tip, today)
    } catch {
      const fallback = ruleBasedCoachTip(state)
      setText(fallback)
      setCoach(fallback, today)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!text) load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="coach-card card">
      <div className="coach-head">
        <h3>今日学习建议</h3>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => load(true)}
          disabled={loading}
        >
          {loading ? '生成中…' : '刷新'}
        </button>
      </div>
      <p className="coach-body">{text || '正在准备建议…'}</p>
      {!configured && (
        <p className="coach-hint">
          填写 API Key 后可获得 AI 个性化建议。
          <Link to="/settings"> 去设置</Link>
        </p>
      )}
    </section>
  )
}
