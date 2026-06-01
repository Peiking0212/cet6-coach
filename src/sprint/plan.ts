import type { ModuleType } from '@/data/types'
import type { SprintDay, SprintTask } from './types'

function ref(module: ModuleType, ...ids: string[]) {
  return { module, ids }
}

function listen(exam: string, set: number, ...parts: string[]) {
  return ref('listening', ...parts.map((p) => `${exam}-set${set}-listen-${p}`))
}

/** 听力完整板块：短篇 + 长对话 */
function listenBlock(exam: string, set: number) {
  return listen(exam, set, 'pass1', 'pass2', 'conv1', 'conv2')
}

function read(exam: string, set: number, kind: 'careful' | 'paragraph' | 'cloze', n?: number) {
  if (kind === 'careful') return ref('reading', `${exam}-set${set}-read-careful-${n}`)
  if (kind === 'paragraph') return ref('reading', `${exam}-set${set}-read-paragraph`)
  return ref('reading', `${exam}-set${set}-read-cloze`)
}

function write(exam: string, set: number) {
  return ref('writing', `${exam}-set${set}-writing`)
}

function trans(exam: string, set: number) {
  return ref('translation', `${exam}-set${set}-translation`)
}

function chk(id: string, label: string, min: number, tips?: string): SprintTask {
  return { id, label, durationMin: min, kind: 'checklist', manualComplete: true, tips }
}

function practice(
  id: string,
  label: string,
  min: number,
  itemRefs: ReturnType<typeof ref>,
  tips?: string,
): SprintTask {
  return { id, label, durationMin: min, kind: 'practice', itemRefs, tips }
}

function queue(
  id: string,
  label: string,
  min: number,
  itemRefs: ReturnType<typeof ref>,
  tips?: string,
): SprintTask {
  return { id, label, durationMin: min, kind: 'practice_queue', itemRefs, tips }
}

function tmpl(
  id: string,
  label: string,
  min: number,
  templateId: 'phenomenon' | 'opinion',
  writingMode: SprintTask['writingMode'],
  exam?: ReturnType<typeof write>,
  tips?: string,
): SprintTask {
  return {
    id,
    label,
    durationMin: min,
    kind: 'template',
    templateId,
    writingMode,
    itemRefs: exam,
    tips,
  }
}

const IRON_RULE = '铁律：到点就停，不返工。只学得分技巧，不抠语法生词，难题直接跳过。'

/** 打基础 · 听力 1 段：7+11+7 */
function listenBasicDay(
  prefix: string,
  exam: string,
  set: number,
  segment: string,
  label: string,
): SprintTask[] {
  return [
    practice(`${prefix}-listen-do`, `听力：${label} · 做题`, 7, listen(exam, set, segment), '不暂停不倒回，听到就选'),
    chk(`${prefix}-listen-review`, '精读答案句，跟读2遍', 11, '用红笔只划答案句'),
    chk(`${prefix}-listen-words`, '记3个高频词（看英文记中文）', 7),
  ]
}

/** 打基础 · 阅读：12+10+3 */
function readBasicDay(prefix: string, exam: string, set: number, carefulN: number): SprintTask[] {
  return [
    practice(
      `${prefix}-read-careful`,
      `仔细阅读 1 篇（第${set}套）`,
      12,
      read(exam, set, 'careful', carefulN),
      '定位关键词 → 定位句 + 前后各 1 句',
    ),
    practice(
      `${prefix}-read-para`,
      '长篇匹配 1 篇',
      10,
      read(exam, set, 'paragraph'),
      '题干圈核心名词 → 扫读找原词复现',
    ),
    chk(`${prefix}-read-err`, '错题原因简写（定位错 / 看错选项）', 3),
  ]
}

/** 打基础 · 翻译：8+12 */
function transBasicDay(prefix: string, exam: string, set: number): SprintTask[] {
  return [
    practice(`${prefix}-trans-do`, '8分钟动手翻', 8, trans(exam, set), '全用简单句，不会就换近义词'),
    chk(
      `${prefix}-trans-words`,
      '对照答案，摘抄4个中国特色高频词，读2遍记中文',
      12,
      '圈地道表达，大声朗读',
    ),
  ]
}

/** 强化 · 听力板块：10+10+5 */
function listenIntensiveDay(prefix: string, exam: string, set: number, label: string): SprintTask[] {
  return [
    queue(`${prefix}-listen-do`, `听力完整板块：${label}（短篇+长对话）限时10分钟`, 10, listenBlock(exam, set)),
    chk(`${prefix}-listen-review`, '对答案，划答案句，标转折词', 10),
    chk(`${prefix}-listen-words`, '摘3个词 + 2个短语', 5),
  ]
}

/** 强化 · 阅读提速 */
function readIntensiveDay(prefix: string, exam: string, set: number, carefulN: number): SprintTask[] {
  return [
    practice(
      `${prefix}-read-careful-do`,
      `仔细阅读 1 篇 · 强制8分钟做完`,
      8,
      read(exam, set, 'careful', carefulN),
    ),
    chk(`${prefix}-read-careful-review`, '7分钟定位法复盘，绝不回读', 7),
    practice(`${prefix}-read-para-do`, '长篇匹配 1 篇 · 强制7分钟做完', 7, read(exam, set, 'paragraph')),
    chk(`${prefix}-read-para-review`, '3分钟错题复盘，标记绝对词陷阱（must/never/only）', 3),
  ]
}

/** 完整作文：5+15+5 */
function essayFullDay(
  prefix: string,
  templateId: 'phenomenon' | 'opinion',
  exam: string,
  set: number,
): SprintTask[] {
  const name = templateId === 'phenomenon' ? '现象类' : '观点类'
  return [
    chk(`${prefix}-essay-outline`, `【${name}】5分钟列提纲`, 5, '列关键词 + 三段论点'),
    tmpl(
      `${prefix}-essay-write`,
      `15分钟完整写一篇约150词（严格套模板）`,
      15,
      templateId,
      'full',
      write(exam, set),
    ),
    chk(`${prefix}-essay-check`, '5分钟自查拼写 / 单复数 / 时态', 5),
  ]
}

/** 强化 · 翻译：10+10 */
function transIntensiveDay(prefix: string, exam: string, set: number): SprintTask[] {
  return [
    practice(`${prefix}-trans-do`, '10分钟完整翻（全用简单句）', 10, trans(exam, set)),
    chk(`${prefix}-trans-fix`, '对照并改写别扭句子，摘4个表达', 10),
  ]
}

const DAY1: SprintDay = {
  day: 1,
  title: '打基础',
  goal: '打基础 · 熟悉套路 · 2022年9月第1套',
  summaryReminders: [IRON_RULE, '明天：观点类模板 + 2023年12月第1套。'],
  blocks: [
    {
      time: '19:00-19:10',
      title: '收心',
      tasks: [chk('d1-warm', '收心准备：清空桌面，手机放远，默念铁律', 10, IRON_RULE)],
    },
    {
      time: '19:10-19:35',
      title: '听力',
      tasks: listenBasicDay('d1', '2022-09', 1, 'pass1', '2022年9月第1套 · 1段'),
    },
    {
      time: '19:35-20:00',
      title: '阅读',
      tasks: readBasicDay('d1', '2022-09', 1, 1),
    },
    {
      time: '20:00-20:15',
      title: '选词',
      tasks: [
        practice('d1-cloze-do', '选词填空：5分钟蒙完（无电子版则用第1套纸质卷）', 5, read('2022-09', 1, 'careful', 2), '不认识就跳'),
        chk('d1-cloze-pos', '10分钟只学「先判词性」', 10, '把选项按名词/动词/形容词/副词分类'),
      ],
    },
    {
      time: '20:15-20:40',
      title: '作文',
      tasks: [
        tmpl('d1-essay-copy', '抄写 + 背诵【现象类】模板框架', 8, 'phenomenon', 'outline'),
        tmpl(
          'd1-essay-intro',
          '仿写开头段 + 结尾段（2022年9月第1套作文题）',
          10,
          'phenomenon',
          'intro',
          write('2022-09', 1),
        ),
        chk(
          'd1-essay-sent',
          '默写3个万能句型',
          7,
          'There is no doubt that… / It is widely acknowledged that… / From my perspective,…',
        ),
      ],
    },
    {
      time: '20:40-21:00',
      title: '翻译',
      tasks: transBasicDay('d1', '2022-09', 1),
    },
  ],
}

const DAY2: SprintDay = {
  day: 2,
  title: '打基础',
  goal: '打基础 · 2023年12月第1套（阅读/翻译）+ 2022年9月听力',
  summaryReminders: [IRON_RULE, '明天：现象类完整写作 + 2022年9月第1套。'],
  blocks: [
    {
      time: '19:00-19:10',
      title: '收心',
      tasks: [chk('d2-warm', '收心', 10, IRON_RULE)],
    },
    {
      time: '19:10-19:35',
      title: '听力',
      tasks: listenBasicDay('d2', '2022-09', 1, 'pass2', '2022年9月第1套 · 1段'),
    },
    {
      time: '19:35-20:00',
      title: '阅读',
      tasks: [
        practice(
          'd2-read-careful',
          '仔细阅读 1 篇（2022年9月第1套 Passage Two）',
          12,
          read('2022-09', 1, 'careful', 2),
          '定位关键词 → 定位句 + 前后各 1 句',
        ),
        practice(
          'd2-read-para',
          '长篇匹配 1 篇（2023年12月第1套）',
          10,
          read('2023-12', 1, 'paragraph'),
          '题干圈核心名词 → 扫读找原词复现',
        ),
        chk('d2-read-err', '错题原因简写（定位错 / 看错选项）', 3),
      ],
    },
    {
      time: '20:00-20:15',
      title: '选词',
      tasks: [
        practice('d2-cloze-do', '选词填空：5分钟蒙完（无电子版则用纸质卷）', 5, read('2022-09', 1, 'careful', 1), '不认识就跳'),
        chk('d2-cloze-pos', '10分钟只学「先判词性」', 10, '把选项按名词/动词/形容词/副词分类'),
      ],
    },
    {
      time: '20:15-20:40',
      title: '作文',
      tasks: [
        tmpl('d2-essay-copy', '抄写 + 背诵【观点类】模板框架', 8, 'opinion', 'outline'),
        tmpl(
          'd2-essay-body',
          '仿写中间主体论述段（2022年9月第1套作文题）',
          10,
          'opinion',
          'body',
          write('2022-09', 1),
        ),
        chk(
          'd2-essay-sent',
          '默写3个万能句型',
          7,
          'As far as I am concerned,… / Every coin has two sides. / It goes without saying that…',
        ),
      ],
    },
    {
      time: '20:40-21:00',
      title: '翻译',
      tasks: transBasicDay('d2', '2023-12', 1),
    },
  ],
}

const DAY3: SprintDay = {
  day: 3,
  title: '打基础，作文提速',
  goal: '打基础 · 现象类完整写作 · 2022年9月第1套',
  summaryReminders: [IRON_RULE, '明天：观点类完整写作。'],
  blocks: [
    {
      time: '19:00-19:10',
      title: '收心',
      tasks: [chk('d3-warm', '收心', 10, IRON_RULE)],
    },
    {
      time: '19:10-19:35',
      title: '听力',
      tasks: listenBasicDay('d3', '2022-09', 1, 'conv1', '2022年9月第1套 · 1段'),
    },
    {
      time: '19:35-20:00',
      title: '阅读',
      tasks: readBasicDay('d3', '2022-09', 1, 1),
    },
    {
      time: '20:00-20:15',
      title: '选词',
      tasks: [
        practice('d3-cloze-do', '选词填空：5分钟蒙完（无电子版则用纸质卷）', 5, read('2022-09', 1, 'careful', 2), '不认识就跳'),
        chk('d3-cloze-pos', '10分钟只学「先判词性」', 10, '把选项按名词/动词/形容词/副词分类'),
      ],
    },
    {
      time: '20:15-20:40',
      title: '作文',
      tasks: essayFullDay('d3', 'phenomenon', '2022-09', 1),
    },
    {
      time: '20:40-21:00',
      title: '翻译',
      tasks: transBasicDay('d3', '2022-09', 1),
    },
  ],
}

const DAY4: SprintDay = {
  day: 4,
  title: '打基础，作文提速',
  goal: '打基础 · 观点类完整写作 · 2023年12月第2套（阅读/翻译）',
  summaryReminders: [IRON_RULE, '明天：进入强化提速阶段。'],
  blocks: [
    {
      time: '19:00-19:10',
      title: '收心',
      tasks: [chk('d4-warm', '收心', 10, IRON_RULE)],
    },
    {
      time: '19:10-19:35',
      title: '听力',
      tasks: listenBasicDay('d4', '2022-09', 1, 'conv2', '2022年9月第1套 · 1段'),
    },
    {
      time: '19:35-20:00',
      title: '阅读',
      tasks: [
        practice(
          'd4-read-careful',
          '仔细阅读 1 篇（2022年9月第1套）',
          12,
          read('2022-09', 1, 'careful', 1),
          '定位关键词 → 定位句 + 前后各 1 句',
        ),
        practice(
          'd4-read-para',
          '长篇匹配 1 篇（2023年12月第2套）',
          10,
          read('2023-12', 2, 'paragraph'),
          '题干圈核心名词 → 扫读找原词复现',
        ),
        chk('d4-read-err', '错题原因简写（定位错 / 看错选项）', 3),
      ],
    },
    {
      time: '20:00-20:15',
      title: '选词',
      tasks: [
        practice('d4-cloze-do', '选词填空：5分钟蒙完（无电子版则用纸质卷）', 5, read('2022-09', 1, 'careful', 2), '不认识就跳'),
        chk('d4-cloze-pos', '10分钟只学「先判词性」', 10, '把选项按名词/动词/形容词/副词分类'),
      ],
    },
    {
      time: '20:15-20:40',
      title: '作文',
      tasks: essayFullDay('d4', 'opinion', '2022-09', 1),
    },
    {
      time: '20:40-21:00',
      title: '翻译',
      tasks: transBasicDay('d4', '2023-12', 2),
    },
  ],
}

const DAY5: SprintDay = {
  day: 5,
  title: '强化提速',
  goal: '强化提速 · 2022年12月第1套（听力+原文）',
  summaryReminders: [IRON_RULE, '明天：观点类完整写作 + 2023年12月第3套。'],
  blocks: [
    {
      time: '19:00-19:10',
      title: '收心',
      tasks: [chk('d5-warm', '收心 + 快速回顾昨天听力/翻译词1分钟', 10, IRON_RULE)],
    },
    {
      time: '19:10-19:35',
      title: '听力',
      tasks: listenIntensiveDay('d5', '2022-12', 1, '2022年12月第1套'),
    },
    {
      time: '19:35-20:00',
      title: '阅读',
      tasks: readIntensiveDay('d5', '2022-09', 1, 1),
    },
    {
      time: '20:00-20:15',
      title: '选词',
      tasks: [
        practice('d5-cloze-do', '选词填空：3分钟蒙完（无电子版则用纸质卷）', 3, read('2022-09', 1, 'careful', 2), '不认识就跳'),
        chk('d5-cloze-pos', '7分钟只学「先判词性」', 7, '把选项按名词/动词/形容词/副词分类'),
      ],
    },
    {
      time: '20:15-20:40',
      title: '作文',
      tasks: essayFullDay('d5', 'phenomenon', '2022-09', 1),
    },
    {
      time: '20:40-21:00',
      title: '翻译',
      tasks: transIntensiveDay('d5', '2022-09', 1),
    },
  ],
}

const DAY6: SprintDay = {
  day: 6,
  title: '强化提速',
  goal: '强化提速 · 2023年12月第3套（阅读/翻译/作文）',
  summaryReminders: [IRON_RULE, '明天：现象类 + 2023年12月第1套。'],
  blocks: [
    {
      time: '19:00-19:10',
      title: '收心',
      tasks: [chk('d6-warm', '收心 + 快速回顾昨日词', 10, IRON_RULE)],
    },
    {
      time: '19:10-19:35',
      title: '听力',
      tasks: listenIntensiveDay('d6', '2022-12', 1, '2022年12月第1套'),
    },
    {
      time: '19:35-20:00',
      title: '阅读',
      tasks: [
        practice(
          'd6-read-careful',
          '仔细阅读 1 篇（2022年9月第1套）',
          12,
          read('2022-09', 1, 'careful', 1),
          '定位关键词 → 定位句 + 前后各 1 句',
        ),
        practice(
          'd6-read-para',
          '长篇匹配 1 篇（2023年12月第3套）',
          10,
          read('2023-12', 3, 'paragraph'),
          '题干圈核心名词 → 扫读找原词复现',
        ),
        chk('d6-read-err', '错题原因简写', 3),
      ],
    },
    {
      time: '20:00-20:15',
      title: '选词',
      tasks: [
        practice('d6-cloze-do', '选词填空：3分钟蒙完（无电子版则用纸质卷）', 3, read('2022-09', 1, 'careful', 2), '不认识就跳'),
        chk('d6-cloze-pos', '7分钟只学「先判词性」', 7),
      ],
    },
    {
      time: '20:15-20:40',
      title: '作文',
      tasks: essayFullDay('d6', 'opinion', '2023-12', 3),
    },
    {
      time: '20:40-21:00',
      title: '翻译',
      tasks: transIntensiveDay('d6', '2023-12', 3),
    },
  ],
}

const DAY7: SprintDay = {
  day: 7,
  title: '强化巩固',
  goal: '强化巩固 · 2023年6月第1套听力 + 2023年12月阅读/翻译',
  summaryReminders: [IRON_RULE, '明天：唯一一次全套模考（2023年12月第2套 + 2022年9月听力）。'],
  blocks: [
    {
      time: '19:00-19:10',
      title: '收心',
      tasks: [chk('d7-warm', '收心 + 回顾昨日词', 10, IRON_RULE)],
    },
    {
      time: '19:10-19:35',
      title: '听力',
      tasks: listenIntensiveDay('d7', '2023-06', 1, '2023年6月第1套'),
    },
    {
      time: '19:35-20:00',
      title: '阅读',
      tasks: [
        practice(
          'd7-read-careful',
          '仔细阅读 1 篇（2022年9月第1套 Passage Two）',
          12,
          read('2022-09', 1, 'careful', 2),
        ),
        practice(
          'd7-read-para',
          '长篇匹配 1 篇（2023年12月第1套）',
          10,
          read('2023-12', 1, 'paragraph'),
        ),
        chk('d7-read-err', '错题原因简写', 3),
      ],
    },
    {
      time: '20:00-20:15',
      title: '选词',
      tasks: [
        practice('d7-cloze-do', '选词填空：3分钟蒙完（无电子版则用纸质卷）', 3, read('2022-09', 1, 'careful', 1), '不认识就跳'),
        chk('d7-cloze-pos', '7分钟只学「先判词性」', 7),
      ],
    },
    {
      time: '20:15-20:40',
      title: '作文',
      tasks: essayFullDay('d7', 'phenomenon', '2022-09', 1),
    },
    {
      time: '20:40-21:00',
      title: '翻译',
      tasks: transIntensiveDay('d7', '2023-12', 1),
    },
  ],
}

const DAY8: SprintDay = {
  day: 8,
  title: '唯一一次全套模考',
  goal: '2023年12月第2套 · 60分钟限时模考 + 复盘（听力用2022年9月）',
  summaryReminders: [IRON_RULE, '明天：错题重做 + 补漏新题 + 模板默写。'],
  blocks: [
    {
      time: '19:00-19:10',
      title: '收心',
      tasks: [
        chk(
          'd8-warm',
          '摆好整套真题，坐好，不喝水不起身',
          10,
          '默念顺序：听力→仔细→长篇→翻译→作文→选词',
        ),
      ],
    },
    {
      time: '19:10-20:10',
      title: '60分钟限时模考',
      tasks: [
        chk(
          'd8-mock-start',
          '开始60分钟模考（到点立刻停笔，未做完也蒙上）',
          2,
          '严格按顺序：听力→仔细→长篇→翻译→作文→最后5分钟选词蒙C',
        ),
        {
          id: 'd8-mock-listen',
          label: '模考 · 听力全部（听完立刻假装填卡）',
          durationMin: 25,
          mockDurationMin: 60,
          kind: 'practice_queue',
          itemRefs: listen('2022-09', 1, 'conv1', 'conv2', 'pass1', 'pass2', 'lec1', 'lec2', 'lec3'),
        },
        queue(
          'd8-mock-read',
          '模考 · 仔细阅读 + 长篇匹配',
          20,
          ref(
            'reading',
            '2022-09-set1-read-careful-1',
            '2022-09-set1-read-careful-2',
            '2023-12-set2-read-paragraph',
          ),
        ),
        practice('d8-mock-trans', '模考 · 翻译', 8, trans('2023-12', 2)),
        tmpl('d8-mock-write', '模考 · 作文', 12, 'phenomenon', 'full', write('2023-12', 3)),
        practice('d8-mock-cloze', '模考 · 选词填空（最后5分钟，无电子版则蒙C）', 5, read('2022-09', 1, 'careful', 1)),
      ],
    },
    {
      time: '20:10-20:22',
      title: '听力复盘',
      tasks: [chk('d8-review-listen', '只看错题答案句，重读2遍', 12)],
    },
    {
      time: '20:22-20:35',
      title: '阅读复盘',
      tasks: [chk('d8-review-read', '逐题用定位法重走思路，记踩坑点', 13)],
    },
    {
      time: '20:35-20:50',
      title: '作文翻译复盘',
      tasks: [
        chk(
          'd8-review-write',
          '作文对照范文修低级错，重读模板；翻译对比参考，记失误词句',
          15,
        ),
      ],
    },
    {
      time: '20:50-21:00',
      title: '整体回顾',
      tasks: [chk('d8-review-all', '快速翻一遍所有错题、技巧词条', 10)],
    },
  ],
}

const DAY9: SprintDay = {
  day: 9,
  title: '错题重做 + 补漏',
  goal: '错题重做 · 新题补漏 · 模板默写',
  summaryReminders: [IRON_RULE, '明天：半套模考保持手感。'],
  blocks: [
    {
      time: '19:00-20:00',
      title: '错题重做',
      tasks: [
        chk(
          'd9-wrong',
          '第8天模考错题 + 蒙对题擦掉重做（60分钟）',
          60,
          '二次犯错用红笔画大圈，这是考前最终要看的东西',
        ),
      ],
    },
    {
      time: '20:00-20:30',
      title: '新题补漏',
      tasks: [
        practice(
          'd9-new-careful',
          '全新未做 · 仔细阅读 1 篇（2022年9月第1套 Passage Two）',
          15,
          read('2022-09', 1, 'careful', 2),
          '用定位法做，只标记错题原因',
        ),
        practice(
          'd9-new-para',
          '全新未做 · 长篇匹配 1 篇（2023年12月第2套）',
          15,
          read('2023-12', 2, 'paragraph'),
          '做完对答案，不深究',
        ),
      ],
    },
    {
      time: '20:30-21:00',
      title: '模板默写',
      tasks: [
        chk(
          'd9-tmpl-p',
          '默写【现象类】模板一遍，必须一字不差',
          15,
          '错处红笔订正',
        ),
        chk(
          'd9-tmpl-o',
          '默写【观点类】模板一遍，必须一字不差',
          15,
          '拼写错的大声拼5遍',
        ),
      ],
    },
  ],
}

const DAY10: SprintDay = {
  day: 10,
  title: '半套模考保持手感',
  goal: '半套模考 · 2023年6月第1套听力 + 2022年9月阅读/作文',
  summaryReminders: [IRON_RULE, '明天：半套模考 Day 11（观点类主体段）。'],
  blocks: [
    {
      time: '19:00-19:10',
      title: '收心',
      tasks: [chk('d10-warm', '收心', 10, IRON_RULE)],
    },
    {
      time: '19:10-19:40',
      title: '30分钟限时',
      tasks: [
        queue(
          'd10-half-listen',
          '听力完整板块 + 仔细阅读 1 篇 + 长篇 1 篇（严格限时30分钟）',
          15,
          listenBlock('2023-06', 1),
        ),
        practice('d10-half-careful', '仔细阅读 Passage One', 8, read('2022-09', 1, 'careful', 1)),
        practice('d10-half-para', '长篇匹配', 7, read('2022-09', 1, 'paragraph')),
      ],
    },
    {
      time: '19:40-20:00',
      title: '对答案',
      tasks: [
        chk(
          'd10-check',
          '只看错题对应的答案句/定位句，重读1遍（不分析长难句）',
          20,
        ),
      ],
    },
    {
      time: '20:00-20:10',
      title: '选词',
      tasks: [
        practice('d10-cloze', '选词填空 1 篇 · 3分钟蒙完（无电子版则用纸质卷）', 3, read('2022-09', 1, 'careful', 2)),
        chk('d10-cloze-pos', '核词性', 7),
      ],
    },
    {
      time: '20:10-20:20',
      title: '作文',
      tasks: [
        chk('d10-essay-memo', '5分钟默念【现象类】模板框架', 5),
        tmpl(
          'd10-essay-write',
          '10分钟仿写开头 + 结尾（套模板）',
          10,
          'phenomenon',
          'intro',
          write('2022-09', 1),
        ),
      ],
    },
    {
      time: '20:20-20:40',
      title: '翻译',
      tasks: [
        practice('d10-trans-do', '10分钟翻一段（简单句）', 10, trans('2022-09', 1)),
        chk('d10-trans-words', '对照答案，只记3个不会的词', 10),
      ],
    },
  ],
}

const DAY11: SprintDay = {
  day: 11,
  title: '半套模考保持手感',
  goal: '半套模考 · 2022年12月听力 + 2023年12月阅读/翻译',
  summaryReminders: [IRON_RULE, '明天：考前最后准备，只记不练。'],
  blocks: [
    {
      time: '19:00-19:10',
      title: '收心',
      tasks: [chk('d11-warm', '收心', 10, IRON_RULE)],
    },
    {
      time: '19:10-19:40',
      title: '30分钟限时',
      tasks: [
        queue(
          'd11-half-listen',
          '听力1套 + 仔细1篇 + 长篇1篇（严格限时30分钟）',
          15,
          listenBlock('2022-12', 1),
          '新题用完可重做旧题，同样计时',
        ),
        practice('d11-half-careful', '仔细阅读 1 篇', 8, read('2022-09', 1, 'careful', 1)),
        practice('d11-half-para', '长篇匹配 1 篇', 7, read('2023-12', 1, 'paragraph')),
      ],
    },
    {
      time: '19:40-20:00',
      title: '对答案',
      tasks: [chk('d11-check', '只看错题，记定位错误原因', 20)],
    },
    {
      time: '20:00-20:10',
      title: '选词',
      tasks: [
        practice('d11-cloze', '选词填空 1 篇 · 3分钟蒙完（无电子版则用纸质卷）', 3, read('2022-09', 1, 'careful', 2)),
        chk('d11-cloze-pos', '核词性', 7),
      ],
    },
    {
      time: '20:10-20:20',
      title: '作文',
      tasks: [
        chk('d11-essay-memo', '5分钟默念【观点类】模板框架', 5),
        tmpl(
          'd11-essay-write',
          '10分钟仿写主体论述段',
          10,
          'opinion',
          'body',
          write('2022-09', 1),
        ),
      ],
    },
    {
      time: '20:20-20:40',
      title: '翻译',
      tasks: [
        practice('d11-trans-do', '10分钟翻一段', 10, trans('2023-12', 1)),
        chk('d11-trans-words', '对照记3个不会的词', 10),
      ],
    },
  ],
}

const DAY12: SprintDay = {
  day: 12,
  title: '考前最后准备（只记不练）',
  goal: '只记不练 · 放松早睡',
  summaryReminders: [
    '立刻停止复习，放松，早点睡。',
    '考试时：社会现象→现象类模板；观点对立→观点类模板。',
  ],
  blocks: [
    {
      time: '19:00-19:15',
      title: '听力词',
      tasks: [chk('d12-listen-words', '翻看所有听力高频词纸条，看英念中', 15)],
    },
    {
      time: '19:15-19:30',
      title: '翻译词',
      tasks: [
        chk('d12-trans-words', '翻看所有翻译高频词纸条，重点「中国特色」词', 15),
      ],
    },
    {
      time: '19:30-19:40',
      title: '终极陷阱',
      tasks: [chk('d12-traps', '只看第9天红笔画圈的「终极陷阱」错题', 10)],
    },
    {
      time: '19:40-19:50',
      title: '模板默念',
      tasks: [
        chk(
          'd12-tmpl',
          '默念两套作文模板框架（开头-主体-结尾），不写只过脑',
          10,
        ),
      ],
    },
    {
      time: '19:50-20:00',
      title: '检查离场',
      tasks: [
        chk(
          'd12-pack',
          '检查准考证、身份证、2B铅笔、黑笔、耳机，全部装好',
          5,
        ),
        chk('d12-sleep', '立刻停止，放松，早点睡', 5),
      ],
    },
  ],
}

export const SPRINT_PLAN: SprintDay[] = [
  DAY1,
  DAY2,
  DAY3,
  DAY4,
  DAY5,
  DAY6,
  DAY7,
  DAY8,
  DAY9,
  DAY10,
  DAY11,
  DAY12,
]

export const SPRINT_TOTAL_DAYS = SPRINT_PLAN.length

export function getSprintDay(day: number): SprintDay | undefined {
  return SPRINT_PLAN.find((d) => d.day === day)
}

export function allSprintTaskIds(): string[] {
  return SPRINT_PLAN.flatMap((d) => d.blocks.flatMap((b) => b.tasks.map((t) => t.id)))
}

export function allSprintItemRefs(): { taskId: string; module: ModuleType; ids: string[] }[] {
  const out: { taskId: string; module: ModuleType; ids: string[] }[] = []
  for (const day of SPRINT_PLAN) {
    for (const block of day.blocks) {
      for (const task of block.tasks) {
        if (task.itemRefs) {
          out.push({ taskId: task.id, module: task.itemRefs.module, ids: task.itemRefs.ids })
        }
      }
    }
  }
  return out
}
