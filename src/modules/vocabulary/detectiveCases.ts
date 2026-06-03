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
  {
    id: 'campus-cafe',
    title: '校园咖啡厅投毒疑云',
    scene: '☕',
    brief:
      '期末周的清晨，大学咖啡厅一名学生突然晕厥。警方封锁现场，四种饮品残留被送检。你是校方特聘顾问，每破译一个英文关键词，就能还原当晚吧台前的真相。',
    clues: [
      '受害者只喝了半杯拿铁，杯沿有淡淡的杏仁苦味。',
      '监控里 6:40 有人调换了两杯饮品的标签贴纸。',
      '吧台垃圾桶里有一张被撕碎的「过敏提示」便条。',
      '值班记录显示一名兼职员工当天迟到了二十分钟。',
      '化验报告：毒物来自实验室保管的氰化物样本，钥匙登记异常。',
    ],
    suspects: [
      { name: '咖啡师 Luna', emoji: '👩‍🍳', trait: '对配方一丝不苟，却讨厌期末拥挤' },
      { name: '医学生 Ken', emoji: '🩺', trait: '常来复习，能接触实验药品' },
      { name: '社团主席 Zoe', emoji: '📣', trait: '组织活动，与受害者有过节' },
      { name: '外卖员 Ray', emoji: '🛵', trait: '熟悉后厨通道，来去匆匆' },
    ],
    culprit: 1,
    deduction:
      '杏仁苦味、实验药品权限、迟到掩盖行踪——能接触氰化物又熟悉吧台的人，更像是那位「来复习」的医学生。',
    verdict: 'Ken 为报复竞赛失利，在标签调换时投毒。及时送医，受害者脱离危险。',
  },
  {
    id: 'startup-leak',
    title: '初创公司泄密夜',
    scene: '💻',
    brief:
      '「粉芽科技」发布新 App 前夜，核心代码库被整包拖走。办公室只剩几台还亮着的显示器。CEO 请你连夜追查——线索词全部藏在当晚的英文邮件与日志里。',
    clues: [
      '泄露 IP 来自公司 VPN，登录时间恰好在全员聚餐时。',
      '邮件草稿标题是「Final offer」，收件人域名与竞品一致。',
      'U 盘插口有新鲜划痕，保安却坚称机房已上锁。',
      '一名工程师的笔记本电池在案发时段异常耗电。',
      '代码 diff 显示后门函数名与其个人项目仓库相同。',
    ],
    suspects: [
      { name: 'CTO Ivy', emoji: '🧑‍💻', trait: '掌握密钥，当晚主持技术演示' },
      { name: '后端 Evan', emoji: '⚙️', trait: '沉默寡言，仓库权限最高' },
      { name: '产品 Mina', emoji: '📱', trait: '熟悉发布节奏，与竞品有旧识' },
      { name: '实习 Leo', emoji: '🎧', trait: '负责值班日志，爱听重金属' },
    ],
    culprit: 1,
    deduction:
      'VPN 内部登录、后门命名习惯、异常耗电——更像是能改核心代码、又提前写好草稿的那位后端。',
    verdict: 'Evan 收下来自竞品的 offer，携代码出逃。法院已签发财产保全，泄密链条被切断。',
  },
  {
    id: 'garden-wedding',
    title: '玫瑰花园婚礼失礼',
    scene: '💒',
    brief:
      '海滨玫瑰花园里，新娘的祖传项链在彩排后消失。宾客名单豪华，人人有不在场证明的嫌疑。解开五条英文线索，找出谁在花海里动了手脚。',
    clues: [
      '首饰盒锁芯完好，像是有人用钥匙从容打开。',
      '花坛泥土上有高跟鞋跟，尺码与伴娘礼服一致。',
      '宾客签到表缺了一行，笔迹与新郎弟弟相似。',
      '调酒师听见有人提起「典当行」与「急用钱」。',
      '项链搭扣处夹着一片不属于花园的深蓝丝绒纤维。',
    ],
    suspects: [
      { name: '伴娘 Chloe', emoji: '👗', trait: '高跟鞋收藏家，最近投资失败' },
      { name: '新郎弟 Max', emoji: '🤵', trait: '赌债缠身，彩排时最早离席' },
      { name: '摄影师 Sam', emoji: '📷', trait: '全程跟拍，却少了一段素材' },
      { name: '花艺师 Pip', emoji: '🌹', trait: '熟悉花园每个角落' },
    ],
    culprit: 1,
    deduction:
      '签到笔迹、急用钱、深蓝丝绒（伴郎礼服内衬）——更像债务压身、又能接近新郎房间的人。',
    verdict: 'Max 典当项链还债，被丝绒纤维出卖。婚礼照常举行，项链完璧归赵。',
  },
]
