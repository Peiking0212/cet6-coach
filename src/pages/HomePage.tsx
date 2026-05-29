import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useStore } from '@/store/StoreProvider'
import { moduleInsights, recommendedModule } from '@/store/adaptive'
import { levelFromPoints } from '@/store/defaults'
import { MODULE_LABELS, type ModuleType } from '@/data/types'
import { moduleCounts, practiceAllPath } from '@/engine/practiceAll'
import { PLACEMENT_LABELS } from '@/store/types'
import { AiCoachCard } from '@/components/AiCoachCard'
import { MakeupBanner } from '@/components/MakeupBanner'
import { useEncourage } from '@/components/EncourageProvider'
import {
  IconFlame,
  IconListen,
  IconRead,
  IconReview,
  IconTranslate,
  IconVocab,
  IconWrite,
} from '@/app/icons'

const moduleIcon: Record<ModuleType, typeof IconListen> = {
  vocabulary: IconVocab,
  listening: IconListen,
  translation: IconTranslate,
  reading: IconRead,
  writing: IconWrite,
}

const moduleDesc: Record<ModuleType, string> = {
  vocabulary: '卡片 · 选择 · 拼写 · 闯关',
  listening: '文本听写 · TTS 朗读',
  translation: '三关进阶 · 汉译英',
  reading: '选词 · 匹配 · 仔细 · 完形 · 七选五',
  writing: '范文 · AI 批改',
}

export function HomePage() {
  const { state } = useStore()
  const nav = useNavigate()
  const { cheer } = useEncourage()
  const { level, cur, need } = levelFromPoints(state.points)
  const prevLevel = useRef(level)
  const insights = moduleInsights(state)
  const reco = recommendedModule(state)
  const counts = moduleCounts()
  const dueCount = state.review.filter((c) => c.due <= Date.now()).length
  const goalPct = Math.min(100, Math.round((state.daily.count / state.daily.goal) * 100))
  const goalDone = state.daily.count >= state.daily.goal
  const prevGoal = useRef(goalDone)

  const hour = new Date().getHours()
  const greeting = hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

  useEffect(() => {
    if (level > prevLevel.current) {
      cheer('levelup')
      prevLevel.current = level
    }
  }, [level, cheer])

  useEffect(() => {
    if (goalDone && !prevGoal.current) cheer('goal')
    prevGoal.current = goalDone
  }, [goalDone, cheer])

  return (
    <div className="home">
      <div className="home-hero card">
        <div className="hero-left">
          <div className="hero-greet">{greeting}，继续加油 ✨</div>
          <div className="hero-level">
            <span className="pill">Lv.{level}</span>
            {state.placementLevel && (
              <span className="pill placement-badge">
                {PLACEMENT_LABELS[state.placementLevel]}
              </span>
            )}
            <span className="hero-points">{state.points} 积分</span>
          </div>
          <div className="hero-bar">
            <div className="hero-bar-fill" style={{ width: `${(cur / need) * 100}%` }} />
          </div>
          <div className="hero-chips">
            <span className="chip">
              <IconFlame size={15} /> 连续 {state.streak.count} 天
              {state.streak.longest > 0 && `（最长 ${state.streak.longest}）`}
            </span>
            <span className="chip">连击 {state.combo}（最高 {state.bestCombo}）</span>
            <span className="chip">已答 {state.answered} 题</span>
          </div>
        </div>
        <div
          className={`goal-ring${goalDone ? ' goal-ring-done' : ''}`}
          role="img"
          aria-label={`今日目标 ${goalPct}%`}
        >
          <svg viewBox="0 0 100 100">
            <circle className="ring-bg" cx="50" cy="50" r="42" />
            <circle
              className="ring-fg"
              cx="50"
              cy="50"
              r="42"
              strokeDasharray={`${(goalPct / 100) * 264} 264`}
            />
          </svg>
          <div className="goal-ring-text">
            <strong>{state.daily.count}</strong>
            <span>/ {state.daily.goal}</span>
          </div>
          {goalDone && <span className="goal-celebrate">🎉</span>}
        </div>
      </div>

      <div className="home-quick-row">
        <button type="button" className="btn btn-primary micro-btn" onClick={() => nav('/micro')}>
          ⚡ 3 分钟微学习
        </button>
      </div>

      <MakeupBanner />

      <AiCoachCard />

      <section className="reco card">
        <div className="reco-tag">为你推荐 · 薄弱点优先</div>
        <div className="reco-body" onClick={() => nav(`/${reco.module}`)} role="button" tabIndex={0}>
          <div className="reco-icon">
            {(() => {
              const I = moduleIcon[reco.module]
              return <I size={30} />
            })()}
          </div>
          <div className="reco-info">
            <h3>先练「{MODULE_LABELS[reco.module]}」</h3>
            <p>
              {reco.attempts === 0
                ? '还没练过，先来开个头吧。'
                : `当前正确率 ${Math.round(reco.accuracy * 100)}%，这块最值得加强。`}
            </p>
          </div>
          <span className="reco-go">开始 →</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost reco-practice-all"
          onClick={() => nav(practiceAllPath(reco.module))}
        >
          全部练习 · {counts[reco.module].total} 题
        </button>
      </section>

      {dueCount > 0 && (
        <Link to="/review" className="review-banner card">
          <IconReview size={22} />
          <span>
            有 <strong>{dueCount}</strong> 道错题到复习时间了
          </span>
          <span className="reco-go">去复习 →</span>
        </Link>
      )}

      <h2 className="section-title">五大模块</h2>
      <div className="module-grid">
        {insights.map((ins) => {
          const I = moduleIcon[ins.module]
          const info = counts[ins.module]
          return (
            <div key={ins.module} className="module-card card">
              <Link to={`/${ins.module}`} className="module-card-link">
                <div className="module-card-top">
                  <span className="module-icon">
                    <I size={24} />
                  </span>
                  <span className="module-count">{info.total}</span>
                  {ins.attempts > 0 && (
                    <span className="module-acc">{Math.round(ins.accuracy * 100)}%</span>
                  )}
                </div>
                <h3>{MODULE_LABELS[ins.module]}</h3>
                <p>{moduleDesc[ins.module]}</p>
                <p className="module-count-detail">{info.detail}</p>
                <div className="module-prog">
                  <div
                    className="module-prog-fill"
                    style={{ width: `${ins.attempts > 0 ? ins.accuracy * 100 : 0}%` }}
                  />
                </div>
              </Link>
              <button
                type="button"
                className="btn btn-ghost module-practice-all"
                onClick={() => nav(practiceAllPath(ins.module))}
              >
                全部练习
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
