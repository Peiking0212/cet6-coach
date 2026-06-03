import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Stars } from '@/components/Stars'
import { PracticeAllBanner } from '@/components/PracticeAllBanner'
import { VOCAB_SOURCES } from '@/data'
import { moduleCounts } from '@/engine/practiceAll'
import { useStore } from '@/store/StoreProvider'
import { buildDecks } from './vocab'
import { VocabMemoryAids } from './VocabMemoryAids'
import { FlashcardRunner } from './FlashcardRunner'
import { ChoiceRunner } from './ChoiceRunner'
import { SpellingRunner } from './SpellingRunner'
import { ChallengeRunner } from './ChallengeRunner'
import { DetectiveRunner } from './DetectiveRunner'

type Mode = 'flashcard' | 'choice' | 'spelling' | 'challenge' | 'detective'

const MODES: { key: Mode; emoji: string; title: string; desc: string; cls: string }[] = [
  { key: 'flashcard', emoji: '🃏', title: '学习卡片', desc: '翻卡认词 · TTS 发音 · 标记复习', cls: 'm-flash' },
  { key: 'choice', emoji: '🔤', title: '中英选择', desc: '看词选义 / 看义选词', cls: 'm-choice' },
  { key: 'spelling', emoji: '✍️', title: '拼写听写', desc: '听发音，拼出单词', cls: 'm-spell' },
  { key: 'challenge', emoji: '⚡', title: '闯关挑战', desc: '45 秒极速连击', cls: 'm-challenge' },
  { key: 'detective', emoji: '🔍', title: '侦探游戏', desc: '解锁线索破案', cls: 'm-detective' },
]

const ALL = 'all'
const MIXED = 'mixed'
const DEFAULT_SOURCE = VOCAB_SOURCES[0]?.id ?? 'curated'

export function VocabularyPage() {
  const { state } = useStore()
  const [params] = useSearchParams()
  const [sourceId, setSourceId] = useState(DEFAULT_SOURCE)
  const isMixed = sourceId === MIXED
  const source = isMixed ? null : VOCAB_SOURCES.find((s) => s.id === sourceId) ?? VOCAB_SOURCES[0]
  const activeWords = isMixed ? VOCAB_SOURCES.flatMap((s) => s.words) : source!.words
  const sourceLabel = isMixed ? '混合复习' : source!.label

  const decks = useMemo(() => buildDecks(activeWords, isMixed ? MIXED : source!.id), [activeWords, isMixed, source])
  const [deckId, setDeckId] = useState<string>(ALL)
  const [mode, setMode] = useState<Mode | null>(null)
  const [practiceAll, setPracticeAll] = useState(false)
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null)

  const mastery = useMemo(() => {
    let mastered = 0
    let learning = 0
    for (const w of activeWords) {
      const f = state.vocab[w.id]?.familiarity ?? 0
      if (f >= 4) mastered += 1
      else if (f >= 1) learning += 1
    }
    return { mastered, learning, total: activeWords.length }
  }, [state.vocab, activeWords])

  const selectedWords =
    deckId === ALL ? activeWords : decks.find((d) => d.id === deckId)?.words ?? activeWords
  const selectedLabel = deckId === ALL ? '全部' : decks.find((d) => d.id === deckId)?.label ?? '全部'
  const previewWords = deckId === ALL ? selectedWords.slice(0, 12) : selectedWords
  const previewTruncated = deckId === ALL && selectedWords.length > previewWords.length
  const isPhraseDeck = !isMixed && (sourceId === 'phrases-gift' || sourceId === 'bbdc')

  const onSourceChange = (id: string) => {
    setSourceId(id)
    setDeckId(ALL)
    setExpandedWordId(null)
    setMode(null)
    setPracticeAll(false)
  }

  const startMode = (m: Mode, all = false) => {
    setPracticeAll(all)
    setMode(m)
  }

  if (mode) {
    const exit = () => {
      setMode(null)
      setPracticeAll(false)
    }
    const deckKey = practiceAll ? `${deckId}:all` : deckId
    const label = `${sourceLabel} · ${selectedLabel}${practiceAll ? ' · 全部' : ''}`
    if (mode === 'flashcard')
      return (
        <FlashcardRunner
          words={selectedWords}
          deckId={deckKey}
          deckLabel={label}
          onExit={exit}
        />
      )
    if (mode === 'choice')
      return (
        <ChoiceRunner
          words={selectedWords}
          pool={activeWords}
          deckId={deckKey}
          deckLabel={label}
          practiceAll={practiceAll}
          onExit={exit}
        />
      )
    if (mode === 'spelling')
      return (
        <SpellingRunner
          words={selectedWords}
          deckId={deckKey}
          deckLabel={label}
          onExit={exit}
        />
      )
    if (mode === 'detective')
      return (
        <DetectiveRunner words={selectedWords} pool={activeWords} onExit={exit} />
      )
    if (mode === 'challenge')
      return <ChallengeRunner words={selectedWords} pool={activeWords} onExit={exit} />
    return null
  }

  const masteredPct = mastery.total ? Math.round((mastery.mastered / mastery.total) * 100) : 0
  const detectiveStars = state.progress.vocabulary.stars['vocab-detective'] ?? 0
  const phraseHidden = (key: Mode) => isPhraseDeck && (key === 'spelling' || key === 'detective')
  const visibleModes = MODES.filter((m) => !phraseHidden(m.key))

  useEffect(() => {
    if (params.get('practiceAll') === '1' && !mode) startMode('choice', true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  return (
    <div>
      <PageHeader
        title="单词"
        subtitle={`${sourceLabel} · ${mastery.total} 条 · 五种玩法 · TTS 发音`}
      />

      <PracticeAllBanner
        label={`${sourceLabel} · ${selectedLabel}`}
        count={{ total: selectedWords.length, detail: `${selectedWords.length} 条` }}
        detail="条"
        shuffled={false}
        showShuffle={false}
        onToggleShuffle={() => {}}
        onStart={() => startMode('choice', true)}
      />
      <p className="vocab-practice-all-hint">
        卡片 / 拼写模式选「全部」范围后进入玩法，也会刷完所选全部词条。
      </p>

      <h2 className="section-title">词库</h2>
      <div className="deck-row vocab-source-row">
        <button
          className={`deck-chip vocab-source-chip${isMixed ? ' active' : ''}`}
          onClick={() => onSourceChange(MIXED)}
        >
          <span className="vocab-source-label">混合复习</span>
          <span className="vocab-source-count">{moduleCounts().vocabulary.total}</span>
          <span className="vocab-source-sub">全词库随机</span>
        </button>
        {VOCAB_SOURCES.map((s) => (
          <button
            key={s.id}
            className={`deck-chip vocab-source-chip${sourceId === s.id ? ' active' : ''}`}
            onClick={() => onSourceChange(s.id)}
          >
            <span className="vocab-source-label">{s.label}</span>
            <span className="vocab-source-count">{s.words.length}</span>
            {s.subtitle && <span className="vocab-source-sub">{s.subtitle}</span>}
          </button>
        ))}
      </div>

      <div className="vocab-stats card">
        <div className="vstat">
          <strong>{mastery.total}</strong>
          <span>{isPhraseDeck ? '词组总量' : '词库总量'}</span>
        </div>
        <div className="vstat">
          <strong className="vstat-good">{mastery.mastered}</strong>
          <span>已掌握</span>
        </div>
        <div className="vstat">
          <strong className="vstat-learn">{mastery.learning}</strong>
          <span>学习中</span>
        </div>
        <div className="vstat-ring">
          <div className="vstat-ring-bar">
            <div className="vstat-ring-fill" style={{ width: `${masteredPct}%` }} />
          </div>
          <span>{masteredPct}% 掌握</span>
        </div>
      </div>

      <h2 className="section-title">选择范围</h2>
      <div className="deck-row">
        <button
          className={`deck-chip${deckId === ALL ? ' active' : ''}`}
          onClick={() => setDeckId(ALL)}
        >
          全部 {mastery.total}
        </button>
        {decks.map((d) => {
          const stars = state.progress.vocabulary.stars[d.id] ?? 0
          return (
            <button
              key={d.id}
              className={`deck-chip${deckId === d.id ? ' active' : ''}`}
              onClick={() => setDeckId(d.id)}
            >
              {d.label}
              {stars > 0 && <Stars value={stars} size={11} />}
            </button>
          )
        })}
      </div>

      <h2 className="section-title">词库预览 · {selectedLabel}</h2>
      {previewTruncated && (
        <p className="vocab-preview-note">
          展示前 {previewWords.length} {isPhraseDeck ? '条' : '词'}，选择分组可查看完整列表
        </p>
      )}
      <div className="vocab-preview-list">
        {previewWords.map((w) => {
          const open = expandedWordId === w.id
          const fam = state.vocab[w.id]?.familiarity ?? 0
          return (
            <div key={w.id} className={`vocab-preview card${open ? ' open' : ''}`}>
              <button
                className="vocab-preview-head"
                onClick={() => setExpandedWordId(open ? null : w.id)}
              >
                <div className="vocab-preview-word">
                  <strong>{w.word}</strong>
                  {w.phonetic && <span className="vocab-preview-phon">{w.phonetic}</span>}
                </div>
                <div className="vocab-preview-meta">
                  <span className="vocab-preview-mean">{w.meaning}</span>
                  {fam > 0 && <span className="vocab-preview-fam">{fam >= 4 ? '已掌握' : '学习中'}</span>}
                  <span className="vocab-preview-chevron">{open ? '▲' : '▼'}</span>
                </div>
              </button>
              {open && (
                <div className="vocab-preview-body fade-in">
                  {w.pos && <div className="vocab-preview-pos">{w.pos}</div>}
                  {w.example && <div className="vocab-eg">{w.example}</div>}
                  {w.exampleCn && <div className="vocab-eg-cn">{w.exampleCn}</div>}
                  <VocabMemoryAids word={w} compact />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <h2 className="section-title">玩法</h2>
      <div className="mode-grid">
        {visibleModes.map((m) => (
          <button key={m.key} className={`mode-card card ${m.cls}`} onClick={() => startMode(m.key)}>
            <span className="mode-emoji">{m.emoji}</span>
            <div className="mode-info">
              <div className="mode-title">
                {m.title}
                {m.key === 'detective' && detectiveStars > 0 && (
                  <Stars value={detectiveStars} size={11} />
                )}
              </div>
              <div className="mode-desc">{m.desc}</div>
            </div>
            <span className="mode-range">
              {sourceLabel} · {selectedLabel}
            </span>
          </button>
        ))}
      </div>

      <h2 className="section-title">全部练习</h2>
      <div className="vocab-practice-all-row">
        {visibleModes
          .filter((m) => m.key !== 'challenge' && m.key !== 'detective')
          .map((m) => (
          <button
            key={`all-${m.key}`}
            className="btn btn-ghost vocab-practice-all-btn"
            onClick={() => startMode(m.key, true)}
          >
            {m.emoji} {m.title} · 全部 {selectedWords.length} 条
          </button>
        ))}
      </div>
    </div>
  )
}
