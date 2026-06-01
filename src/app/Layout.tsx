import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  IconChat,
  IconFlame,
  IconHome,
  IconListen,
  IconRead,
  IconReview,
  IconSettings,
  IconStar,
  IconTranslate,
  IconVocab,
  IconWrite,
} from './icons'
import { useStore } from '@/store/StoreProvider'
import { levelFromPoints } from '@/store/defaults'
import { PLACEMENT_LABELS } from '@/store/types'
import { PomodoroTimer } from '@/components/PomodoroTimer'
import { AiDock } from '@/components/AiDock'
import './layout.css'

const nav = [
  { to: '/', label: '首页', icon: IconHome, end: true },
  { to: '/sprint', label: '12天冲刺', icon: IconFlame },
  { to: '/vocabulary', label: '单词', icon: IconVocab },
  { to: '/listening', label: '听力', icon: IconListen },
  { to: '/translation', label: '翻译', icon: IconTranslate },
  { to: '/reading', label: '阅读', icon: IconRead },
  { to: '/writing', label: '作文', icon: IconWrite },
  { to: '/review', label: '复习', icon: IconReview },
  { to: '/chat', label: '答疑', icon: IconChat },
]

const bottomNav = nav.filter((n) =>
  ['/', '/sprint', '/vocabulary', '/listening', '/translation', '/reading', '/writing'].includes(n.to),
)

export function Layout({ children }: { children: ReactNode }) {
  const { state } = useStore()
  const { level, cur, need } = levelFromPoints(state.points)
  const loc = useLocation()
  const dueCount = state.review.filter((c) => c.due <= Date.now()).length

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">六</div>
          <div>
            <div className="brand-title">六级陪练</div>
            <div className="brand-sub">CET-6 Coach</div>
          </div>
        </div>

        <div className="level-card card">
          <div className="level-row">
            <span className="pill">Lv.{level}</span>
            <span className="level-pts">{state.points} 分</span>
          </div>
          <div className="level-bar">
            <div className="level-bar-fill" style={{ width: `${(cur / need) * 100}%` }} />
          </div>
          <div className="level-stats">
            <span className="stat-chip">
              <IconFlame size={14} /> 连续 {state.streak.count} 天
            </span>
            <span className="stat-chip">
              <IconStar size={13} filled /> 今日 {state.daily.count}/{state.daily.goal}
            </span>
          </div>
          {state.placementLevel && (
            <span className="pill placement-badge-sm">{PLACEMENT_LABELS[state.placementLevel]}</span>
          )}
        </div>

        <PomodoroTimer />

        <nav className="nav">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <n.icon size={20} />
              <span>{n.label}</span>
              {n.to === '/review' && dueCount > 0 && <span className="badge">{dueCount}</span>}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/settings" className="nav-item settings-link">
          <IconSettings size={20} />
          <span>设置</span>
        </NavLink>
      </aside>

      <main className="main">
        <div className="main-inner" key={loc.pathname}>
          {children}
        </div>
      </main>

      <nav className="bottom-nav">
        {bottomNav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `bn-item${isActive ? ' active' : ''}`}
          >
            <n.icon size={22} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <AiDock />
    </div>
  )
}
