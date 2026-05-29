export interface Suspect {
  name: string
  emoji: string
  trait: string
}

export interface DetectiveCase {
  id: string
  title: string
  scene: string
  brief: string
  /** narrative line revealed each time a clue is unlocked */
  clues: string[]
  suspects: Suspect[]
  culprit: number
  /** hint that points at the culprit, shown on the accusation screen */
  deduction: string
  verdict: string
}

export const CASES: DetectiveCase[] = [
  {
    id: 'pink-diamond',
    title: '粉钻失窃案',
    scene: '🏛️',
    brief:
      '深夜的「玫瑰美术馆」警铃大作——镇馆之宝「粉色之心」钻石不翼而飞。你，城中最负盛名的名侦探，被紧急请到现场。每解开一个英文线索词，就能点亮一条关键证据……',
    clues: [
      '展柜玻璃被整齐切开，凶手手法娴熟，绝非临时起意。',
      '监控显示 22:14 有人关闭了主电闸——此人熟悉馆内电路。',
      '现场遗落一枚带有香水味的手套，气味偏冷调、昂贵。',
      '账本显示一名内部人员近期负债累累，急需用钱。',
      '保险库密码最近被人偷偷改过，只有少数人有权限。',
    ],
    suspects: [
      { name: '馆长 Mr. Vale', emoji: '🎩', trait: '熟悉一切，却最近频繁加班' },
      { name: '电工 Sparks', emoji: '🔧', trait: '懂电路，案发当晚却「请了假」' },
      { name: '名媛 Lady Rose', emoji: '💄', trait: '钟爱昂贵冷调香水，近期负债' },
      { name: '保安 Big Tom', emoji: '🛡️', trait: '体格壮硕，巡逻路线固定' },
    ],
    culprit: 2,
    deduction:
      '冷调昂贵香水 + 切割手法精细 + 改密码需内部信任——线索都指向那位常出入贵宾室、负债却仍挥金如土的人。',
    verdict: '正是 Lady Rose！她用债务换来的香水出卖了自己。粉色之心，完璧归赵。',
  },
  {
    id: 'midnight-library',
    title: '午夜图书馆谜案',
    scene: '📚',
    brief:
      '城市图书馆珍藏的一份古老手稿在闭馆后离奇消失。门窗完好，唯有一盏台灯还亮着。馆员们个个神色慌张。破译线索词，还原那个午夜究竟发生了什么。',
    clues: [
      '手稿被人用专业工具小心取走，没有丝毫撕裂。',
      '借阅记录里，有人反复查阅这份手稿的修复笔记。',
      '台灯下留着一张写满古文翻译的草稿纸。',
      '后门的指纹属于一个「本不该在场」的人。',
      '有人曾私下出高价，想收购这份手稿未果。',
    ],
    suspects: [
      { name: '修复师 Quill', emoji: '🖋️', trait: '痴迷古籍，技艺精湛' },
      { name: '访客 Dr. Finch', emoji: '🧥', trait: '神秘学者，出价收购未果' },
      { name: '实习生 Mia', emoji: '🎒', trait: '勤奋好学，常熬夜整理' },
      { name: '门卫 Old Joe', emoji: '🔑', trait: '掌管钥匙，记性却不太好' },
    ],
    culprit: 1,
    deduction:
      '反复研究、出价收购、又留下「本不该在场」的指纹——一个外来访客的执念，远比馆内人更危险。',
    verdict: '凶手是 Dr. Finch！求而不得，便铤而走险。手稿被追回，正义未曾缺席。',
  },
]
