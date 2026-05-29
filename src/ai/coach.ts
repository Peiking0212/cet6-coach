import { chat, type ChatMessage } from './client'
import type { AiConfig } from '@/store/types'
import { MODULE_LABELS, type ModuleType } from '@/data/types'
import { moduleInsights } from '@/store/adaptive'
import { PLACEMENT_LABELS, type StoreState } from '@/store/types'
import { todayStr } from '@/store/defaults'

export function ruleBasedCoachTip(state: StoreState): string {
  const reco = moduleInsights(state).sort((a, b) => b.weakness - a.weakness)[0]
  const mod = MODULE_LABELS[reco.module]
  const mins = 10
  const level =
    state.placementLevel != null ? PLACEMENT_LABELS[state.placementLevel] : '未摸底'
  const streak = state.streak.count
  const goalLeft = Math.max(0, state.daily.goal - state.daily.count)

  const parts: string[] = []
  if (streak > 0) parts.push(`已连续打卡 ${streak} 天，保持节奏很棒。`)
  if (goalLeft > 0) parts.push(`今日还差 ${goalLeft} 题完成目标。`)
  parts.push(`当前水平：${level}。`)
  if (reco.attempts === 0) {
    parts.push(`今天建议先练「${mod}」开个头，约 ${mins} 分钟即可。`)
  } else {
    parts.push(
      `今天建议练「${mod}」约 ${mins} 分钟（正确率约 ${Math.round(reco.accuracy * 100)}%，值得加强）。`,
    )
  }
  if (reco.module === 'translation') {
    parts.push('翻译可优先第二关「整句翻译」巩固句型。')
  } else if (reco.module === 'vocabulary') {
    parts.push('单词可用「中英选择」快速过一组。')
  }
  return parts.join('')
}

export async function fetchCoachTip(
  cfg: AiConfig,
  state: StoreState,
  signal?: AbortSignal,
): Promise<string> {
  const reco = moduleInsights(state).sort((a, b) => b.weakness - a.weakness)[0]
  const level =
    state.placementLevel != null ? PLACEMENT_LABELS[state.placementLevel] : '未摸底'
  const modules = (['vocabulary', 'listening', 'translation', 'reading', 'writing'] as ModuleType[])
    .map((m) => {
      const s = state.stats[m]
      const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : null
      return `${MODULE_LABELS[m]}: 正确率${acc ?? '未练'}%, 难度${state.moduleDifficulty[m]}`
    })
    .join('\n')

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        '你是六级陪练 App 的学习教练。用简体中文，语气鼓励、简洁 actionable。只讨论 CET-6 英语学习。给出 2-4 句话的「今日学习建议」，包含具体模块与大约时长（如 10 分钟），不要 markdown 标题。',
    },
    {
      role: 'user',
      content: `用户水平：${level}
连续打卡：${state.streak.count} 天
今日进度：${state.daily.count}/${state.daily.goal} 题
连击：${state.combo}
各模块：\n${modules}
最薄弱模块：${MODULE_LABELS[reco.module]}
请生成今日学习建议。`,
    },
  ]
  return chat(cfg, messages, signal)
}

export function coachTipForToday(state: StoreState): string | null {
  const today = todayStr()
  if (state.coach.date === today && state.coach.text) return state.coach.text
  return null
}
