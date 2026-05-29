import type { ChatMessage } from './client'
import type { WrongItem } from '@/engine/types'

export function explainPrompt(w: WrongItem): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        '你是一位耐心的大学英语六级（CET-6）老师。用简体中文讲解，条理清晰，先给结论再给原因，必要时补充相关词汇/语法/做题技巧。回答控制在 250 字以内。',
    },
    {
      role: 'user',
      content: `题目来源：《${w.refTitle}》(${w.module})
题目：${w.question}
我的答案：${w.yourAnswer}
正确答案：${w.correctAnswer}
${w.explanation ? `参考解析：${w.explanation}` : ''}

请讲解为什么正确答案是对的、我可能错在哪里，并给一个记忆/解题小技巧。`,
    },
  ]
}

export interface WritingGrade {
  scoreText: string
  raw: string
}

export function gradeWritingPrompt(
  prompt: string,
  rubric: { name: string; weight: number; desc: string }[],
  essay: string,
): ChatMessage[] {
  const rubricText = rubric.map((r) => `- ${r.name}（权重${r.weight}）：${r.desc}`).join('\n')
  return [
    {
      role: 'system',
      content:
        '你是 CET-6 作文阅卷老师与写作教练。请严格、专业且鼓励。用简体中文输出，使用 Markdown。',
    },
    {
      role: 'user',
      content: `【作文题目】\n${prompt}\n\n【评分维度】\n${rubricText}\n\n【我的作文】\n${essay}\n\n请按以下结构输出：\n## 总分\n给出 0-15 分制总分与一句话总评。\n## 维度评分\n逐项给分与简评。\n## 逐句修改建议\n挑出 5-8 处问题句，给出「原句 → 修改 → 原因」。\n## 升级表达\n列出可替换的高级词汇/句型 5 条。\n## 参考范文\n给出一篇 150 词左右的高分范文。`,
    },
  ]
}

export function vocabHelpPrompt(word: {
  word: string
  pos: string
  meaning: string
  root?: string
  collocations?: string[]
  memoryTip?: string
}): ChatMessage[] {
  const builtIn = [
    word.root && `词根：${word.root}`,
    word.collocations?.length && `词组：${word.collocations.join('；')}`,
    word.memoryTip && `记忆技巧：${word.memoryTip}`,
  ]
    .filter(Boolean)
    .join('\n')

  return [
    {
      role: 'system',
      content:
        '你是 CET-6 词汇老师。用简体中文，结合 Markdown，帮助学生牢记单词。回答简洁，控制在 200 字以内。',
    },
    {
      role: 'user',
      content: `单词：${word.word}（${word.pos} ${word.meaning}）
${builtIn ? `\n已有内置助记：\n${builtIn}\n\n请在此基础上补充或优化：` : ''}
请提供：
1. **词根词缀**拆解（如有）。
2. 2-3 个**常用搭配/词组**。
3. 一个生动的**联想/助记**技巧（谐音或场景皆可）。`,
    },
  ]
}

export function detectiveStoryPrompt(words: string[], caseTitle: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        '你是一位侦探推理游戏的编剧。用简体中文写一段悬疑、有画面感的开场白，营造紧张刺激的破案氛围。控制在 120 字以内，结尾留一个悬念。',
    },
    {
      role: 'user',
      content: `案件名称：《${caseTitle}》。今天玩家要靠破解这些英文线索词来推进剧情：${words.join(
        '、',
      )}。请写一段引人入胜的开场旁白，把玩家代入「名侦探」的角色，但不要直接剧透凶手。`,
    },
  ]
}

export function chatSystemPrompt(): ChatMessage {
  return {
    role: 'system',
    content:
      '你是「六级陪练」内置的英语学习助教。可以答疑、讲语法、解释词汇、出练习、陪用户用英文对话练口语。默认用简体中文解释，遇到口语练习时用英文并附中文提示。回答简洁实用。',
  }
}
