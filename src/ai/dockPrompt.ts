import type { ChatMessage } from './client'

export interface PageContext {
  path: string
  module?: string
  title?: string
  question?: string
}

export function dockSystemPrompt(ctx: PageContext): ChatMessage {
  const ctxLines = [
    ctx.path && `当前页面：${ctx.path}`,
    ctx.module && `模块：${ctx.module}`,
    ctx.title && `练习：${ctx.title}`,
    ctx.question && `题目上下文：${ctx.question}`,
  ]
    .filter(Boolean)
    .join('\n')

  return {
    role: 'system',
    content: `你是「六级陪练」App 内的英语学习助教，仅讨论大学英语六级（CET-6）相关内容：词汇、语法、阅读、听力、翻译、作文、学习方法与应试技巧。

【严格范围】
- 可以：讲解六级知识点、分析用户正在做的题、给学习建议、出小练习、陪练口语（英语+中文提示）。
- 不可以：娱乐八卦、政治、与英语学习无关的编程/技术、闲聊其他话题。
- 若用户问离题内容，礼貌拒绝并引导回英语学习，例如：「我主要帮你备战六级，咱们聊聊翻译/词汇/阅读吧？」

【风格】简体中文，简洁实用，鼓励但不啰嗦。回答尽量控制在 300 字以内，除非用户要求详细讲解。

${ctxLines ? `【当前学习上下文】\n${ctxLines}` : ''}`,
  }
}
