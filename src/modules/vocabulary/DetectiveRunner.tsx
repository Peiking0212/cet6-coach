import { useMemo, useRef, useState, type ReactNode } from 'react'
import type { VocabWord } from '@/data/types'
import type { WrongItem } from '@/engine/types'
import { useStore } from '@/store/StoreProvider'
import { useTimer, formatTime } from '@/engine/useTimer'
import { useEncourage } from '@/components/EncourageProvider'
import { aiConfigured, AiError, chatStream } from '@/ai/client'
import { detectiveStoryPrompt } from '@/ai/prompts'
import { Markdown } from '@/components/Markdown'
import { MCQ } from '@/components/MCQ'
import { Stars } from '@/components/Stars'
import { distractorWords, shuffle, wordWrong } from './vocab'
import { VocabMemoryAids } from './VocabMemoryAids'
import { CASES, type DetectiveCase } from './detectiveCases'

type Phase = 'pick' | 'intro' | 'investigate' | 'accuse' | 'result'
type ChallengeType = 'blank' | 'match' | 'anagram'

interface Challenge {
  word: VocabWord
  type: ChallengeType
  options: string[]
  answerIndex: number
}

const TYPE_LABEL: Record<ChallengeType, string> = {
  blank: '📝 填补线索句',
  match: '🔤 辨认释义',
  anagram: '🔐 破译乱序密文',
}

function detectiveStarKey(caseId: string) {
  return `detective-${caseId}`
}

function makeAnagram(word: string): string {
  const clean = word.toLowerCase()
  if (clean.length < 2) return clean
  let out = clean
  let guard = 0
  while (out === clean && guard++ < 20) out = shuffle(clean.split('')).join('')
  return out
}

function blankExample(word: VocabWord): string {
  const re = new RegExp(`\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*`, 'i')
  return re.test(word.example) ? word.example.replace(re, '_____') : `（${word.meaning}）`
}

function buildChallenges(theCase: DetectiveCase, words: VocabWord[], pool: VocabWord[]): Challenge[] {
  const source = words.length >= theCase.clues.length ? words : pool
  const picks = shuffle(source).slice(0, theCase.clues.length)
  const types: ChallengeType[] = ['blank', 'match', 'anagram']
  return picks.map((word, i) => {
    const opts = shuffle([word.word, ...distractorWords(word, pool, 3)])
    return {
      word,
      type: types[i % types.length],
      options: opts,
      answerIndex: opts.indexOf(word.word),
    }
  })
}

export function DetectiveRunner({
  words,
  pool,
  onExit,
}: {
  words: VocabWord[]
  pool: VocabWord[]
  onExit: () => void
}) {
  const { record, vocabGrade, setStars, state } = useStore()
  const { onCorrect } = useEncourage()
  const [caseId, setCaseId] = useState<string | null>(null)
  const theCase = useMemo(
    () => (caseId ? CASES.find((c) => c.id === caseId) : null),
    [caseId],
  )
  const challenges = useMemo(
    () => (theCase ? buildChallenges(theCase, words, pool) : []),
    [theCase, words, pool],
  )

  const [phase, setPhase] = useState<Phase>('pick')
  const [ci, setCi] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [solved, setSolved] = useState<boolean[]>([])
  const [accusedRight, setAccusedRight] = useState(false)
  const [phaseAnim, setPhaseAnim] = useState('')
  const agg = useMemo(() => ({ wrong: [] as WrongItem[] }), [])
  const investigating = phase === 'investigate' || phase === 'accuse'
  const { ms } = useTimer(investigating)
  const recorded = useRef(false)

  const goPhase = (next: Phase) => {
    setPhaseAnim('dt-phase-out')
    window.setTimeout(() => {
      setPhase(next)
      setPhaseAnim('dt-phase-in')
    }, 120)
  }

  const pickCase = (id: string) => {
    setCaseId(id)
    setCi(0)
    setSelected(null)
    setRevealed(false)
    setSolved([])
    recorded.current = false
    setPhase('intro')
    setPhaseAnim('dt-phase-in')
  }

  if (phase === 'pick' || !theCase) {
    return (
      <div className="runner">
        <Head title="侦探游戏 · 选案" onExit={onExit} />
        <p className="dt-pick-hint">选择一案，解锁五条英文线索并指认真凶。</p>
        <div className="dt-case-grid">
          {CASES.map((c) => {
            const stars = state.progress.vocabulary.stars[detectiveStarKey(c.id)] ?? 0
            return (
              <button key={c.id} className="dt-case-card card" onClick={() => pickCase(c.id)}>
                <span className="dt-scene">{c.scene}</span>
                <div className="dt-case-card-title">《{c.title}》</div>
                <p className="dt-case-card-brief">{c.brief.slice(0, 48)}…</p>
                {stars > 0 && <Stars value={stars} size={14} />}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const ch = challenges[ci]
  const solvedCount = solved.filter(Boolean).length

  const answer = (i: number) => {
    if (revealed) return
    setSelected(i)
    setRevealed(true)
    const ok = i === ch.answerIndex
    vocabGrade(ch.word.id, ok ? 'know' : 'unknown')
    if (ok) onCorrect(solvedCount + 1)
    setSolved((s) => {
      const c = [...s]
      c[ci] = ok
      return c
    })
    if (!ok) agg.wrong.push(wordWrong(ch.word, ch.options[i]))
  }

  const nextChallenge = () => {
    if (ci + 1 >= challenges.length) {
      goPhase('accuse')
      return
    }
    setCi(ci + 1)
    setSelected(null)
    setRevealed(false)
  }

  const accuse = (idx: number) => {
    const right = idx === theCase.culprit
    setAccusedRight(right)
    const stars = right ? (solvedCount === challenges.length ? 3 : 2) : 1
    if (!recorded.current) {
      recorded.current = true
      record({
        module: 'vocabulary',
        refId: `detective-${theCase.id}`,
        refTitle: `侦探 · ${theCase.title}`,
        level: 'detective',
        correct: solvedCount + (right ? 1 : 0),
        total: challenges.length + 1,
        timeMs: ms,
        wrong: agg.wrong,
      })
      setStars('vocabulary', detectiveStarKey(theCase.id), stars)
    }
    goPhase('result')
  }

  const shellClass = `dt-runner ${phaseAnim}`.trim()

  if (phase === 'intro') {
    return (
      <div className={`runner ${shellClass}`}>
        <Head
          title="侦探游戏"
          onExit={onExit}
          extra={
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: 13, padding: '4px 8px' }}
              onClick={() => {
                setCaseId(null)
                setPhase('pick')
              }}
            >
              换案
            </button>
          }
        />
        <div className="card detective-intro fade-in">
          <div className="dt-scene">{theCase.scene}</div>
          <h2 className="dt-title">《{theCase.title}》</h2>
          <p className="dt-brief">{theCase.brief}</p>
          <AiStory theCase={theCase} words={challenges.map((c) => c.word.word)} />
          <div className="dt-suspects">
            {theCase.suspects.map((s) => (
              <div key={s.name} className="dt-suspect-mini">
                <span className="dt-emoji">{s.emoji}</span>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary runner-next" onClick={() => goPhase('investigate')}>
            🔍 开始调查（{challenges.length} 条线索）
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'investigate') {
    return (
      <div className={`runner ${shellClass}`}>
        <Head
          title={`线索 ${ci + 1} / ${challenges.length}`}
          onExit={onExit}
          extra={<span className="dt-timer">⏱ {formatTime(ms)}</span>}
        />

        <div className="dt-board card">
          <div className="dt-board-title">🗂️ 证据板</div>
          <div className="dt-clue-list">
            {theCase.clues.map((clue, i) => {
              const opened = i < ci || (i === ci && revealed)
              const ok = solved[i]
              return (
                <div
                  key={i}
                  className={`dt-clue${opened ? (ok ? ' unlocked' : ' smudged') : ' locked'}`}
                >
                  <span className="dt-clue-no">{i + 1}</span>
                  <span>
                    {opened ? (ok ? clue : '线索被弄花了，看不太清……') : '🔒 待解锁'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className={`card q-card dt-challenge-card fade-in dt-type-${ch.type}`} key={ci}>
          <div className="dt-challenge-tag">{TYPE_LABEL[ch.type]}</div>
          {ch.type === 'blank' && (
            <div className="q-stem dt-challenge-blank">
              <span className="dt-challenge-hint">在例句空格中填入正确单词：</span>
              <div className="dt-blank-sentence">{blankExample(ch.word)}</div>
              <span className="dt-challenge-sub">提示释义：{ch.word.meaning}</span>
            </div>
          )}
          {ch.type === 'match' && (
            <div className="q-stem dt-challenge-match">
              <span className="dt-match-meaning">{ch.word.meaning}</span>
              <span className="dt-challenge-hint">选出对应的英文单词（{ch.word.pos}）</span>
            </div>
          )}
          {ch.type === 'anagram' && (
            <div className="q-stem dt-challenge-anagram">
              <span className="dt-challenge-hint">乱序密文 · 意为「{ch.word.meaning}」</span>
              <div className="dt-anagram" aria-label="乱序字母">
                {makeAnagram(ch.word.word)
                  .split('')
                  .map((c, idx) => (
                    <span key={idx} className="dt-tile">
                      {c.toUpperCase()}
                    </span>
                  ))}
              </div>
            </div>
          )}
          <MCQ
            options={ch.options}
            selected={selected}
            answerIndex={ch.answerIndex}
            revealed={revealed}
            onSelect={answer}
          />
          {revealed && (
            <div className={`explanation dt-clue-reveal${solved[ci] ? ' dt-success-pop' : ' dt-fail-shake'}`}>
              <div className="explanation-title">
                {solved[ci] ? '✓ 线索解锁！' : `正确答案：${ch.word.word}`} {ch.word.phonetic}
              </div>
              <div className="vocab-eg">{ch.word.example}</div>
              <div className="vocab-eg-cn">{ch.word.exampleCn}</div>
              <VocabMemoryAids word={ch.word} compact />
            </div>
          )}
        </div>

        {revealed && (
          <button className="btn btn-primary runner-next" onClick={nextChallenge}>
            {ci + 1 >= challenges.length ? '锁定嫌疑人 →' : '下一条线索'}
          </button>
        )}
      </div>
    )
  }

  if (phase === 'accuse') {
    return (
      <div className={`runner ${shellClass}`}>
        <Head title="指认凶手" onExit={onExit} extra={<span className="dt-timer">⏱ {formatTime(ms)}</span>} />
        <div className="card dt-accuse-head fade-in">
          <h2 className="dt-title">谁是真凶？</h2>
          <p className="dt-brief">
            你解开了 {solvedCount} / {challenges.length} 条线索。
          </p>
          <div className="explanation">
            <div className="explanation-title">🔎 推理</div>
            {solvedCount >= Math.ceil(challenges.length / 2)
              ? theCase.deduction
              : '线索还不够清晰，凭直觉大胆一搏吧！'}
          </div>
        </div>
        <div className="dt-suspect-grid">
          {theCase.suspects.map((s, i) => (
            <button key={s.name} className="dt-suspect-card card" onClick={() => accuse(i)}>
              <span className="dt-emoji-lg">{s.emoji}</span>
              <div className="dt-suspect-name">{s.name}</div>
              <div className="dt-suspect-trait">{s.trait}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const stars = accusedRight ? (solvedCount === challenges.length ? 3 : 2) : 1
  return (
    <div className={`runner ${shellClass}`}>
      <div className={`done-card card fade-in${accusedRight ? ' dt-win-glow' : ' dt-lose-dim'}`}>
        <div className="done-emoji">{accusedRight ? '🕵️‍♂️' : '🌀'}</div>
        <h2>{accusedRight ? '成功破案！' : '凶手逃脱了…'}</h2>
        <div className="result-stars">
          <Stars value={stars} size={26} />
        </div>
        <p className="dt-verdict">
          {accusedRight
            ? theCase.verdict
            : `真正的凶手是 ${theCase.suspects[theCase.culprit].name}。下次多解开几条线索，真相就在细节里。`}
        </p>
        <p className="dt-result-time">用时 {formatTime(ms)}</p>
        <div className="result-actions">
          <button className="btn btn-ghost" onClick={() => goPhase('pick')}>
            再选一案
          </button>
          <button className="btn btn-primary" onClick={onExit}>
            结案返回
          </button>
        </div>
      </div>
    </div>
  )
}

function Head({
  title,
  onExit,
  extra,
}: {
  title: string
  onExit: () => void
  extra?: ReactNode
}) {
  return (
    <div className="runner-head">
      <button className="btn btn-ghost runner-back" onClick={onExit}>
        ← 退出
      </button>
      <div className="runner-title">{title}</div>
      {extra}
    </div>
  )
}

function AiStory({ theCase, words }: { theCase: DetectiveCase; words: string[] }) {
  const { state } = useStore()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  if (!aiConfigured(state.ai)) return null

  const run = async () => {
    setLoading(true)
    setText('')
    try {
      await chatStream(state.ai, detectiveStoryPrompt(words, theCase.title), (d) =>
        setText((t) => t + d),
      )
    } catch (e) {
      setText(e instanceof AiError ? `（AI 旁白失败：${e.message}）` : '（AI 旁白失败）')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dt-ai-story">
      {!text && !loading && (
        <button className="btn btn-ghost vocab-ai-btn" onClick={run}>
          ✨ 让 AI 渲染开场旁白
        </button>
      )}
      {loading && !text && <div className="ai-loading">AI 正在编写剧情…</div>}
      {text && (
        <div className="ai-explain-box">
          <Markdown text={text} />
        </div>
      )}
    </div>
  )
}
