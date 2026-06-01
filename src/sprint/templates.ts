import type { EssayTemplateId } from './types'

export interface EssayTemplate {
  id: EssayTemplateId
  name: string
  usage: string
  sections: { title: string; content: string }[]
}

export const ESSAY_TEMPLATES: Record<EssayTemplateId, EssayTemplate> = {
  phenomenon: {
    id: 'phenomenon',
    name: '现象类模板',
    usage: '讨论某种社会现象/趋势/问题',
    sections: [
      {
        title: '第一段（引出话题+我的观点）',
        content:
          'In recent years, the issue of [主题词] has aroused wide public concern. It is commonly believed that this phenomenon brings us both advantages and challenges. From my perspective, I tend to agree that [你的观点].',
      },
      {
        title: '第二段（论述两点理由）',
        content:
          'There are two main reasons supporting my view. To begin with, [理由一]. For instance, a recent survey shows that [编一个例子]. Moreover, [理由二]. It is widely acknowledged that without [主题词], we would fail to achieve long-term development.',
      },
      {
        title: '第三段（总结+倡议）',
        content:
          'In conclusion, [重申观点]. It is high time that we took effective measures to deal with this issue. Only in this way can we embrace a better future.',
      },
    ],
  },
  opinion: {
    id: 'opinion',
    name: '观点类模板',
    usage: '讨论两种对立观点/你是否同意',
    sections: [
      {
        title: '第一段（引出争议+表态）',
        content:
          'Nowadays, there is a heated debate over whether [争议话题]. Some people firmly believe that [正方观点], while others argue that [反方观点]. As far as I am concerned, I strongly support the former/latter view.',
      },
      {
        title: '第二段（论证我的观点）',
        content:
          'My standpoint can be justified by the following reasons. First and foremost, [理由一]. This is especially true when we consider the fact that [具体解释]. In addition, [理由二]. A good case in point is that [编一个例子].',
      },
      {
        title: '第三段（总结+重申立场）',
        content:
          'To sum up, although there are different opinions on this topic, I am fully convinced that [你的立场]. What we should do is to take positive actions and make the best of this situation.',
      },
    ],
  },
}

export const UNIVERSAL_SENTENCES = {
  phenomenon: [
    'There is no doubt that...',
    'It is widely acknowledged that...',
    'From my perspective,...',
  ],
  opinion: [
    'As far as I am concerned,...',
    'Every coin has two sides.',
    'It goes without saying that...',
  ],
}
