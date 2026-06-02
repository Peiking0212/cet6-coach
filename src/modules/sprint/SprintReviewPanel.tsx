import { useMemo } from 'react'
import type {
  ListeningItem,
  ReadingItem,
  TranslationItem,
  WritingItem,
} from '@/data/types'
import { IconPlay } from '@/app/icons'
import { useExamAudio } from '@/modules/listening/useExamAudio'
import { sanitizeReadingItem } from '@/lib/sanitizeReadingItem'
import { resolveItemRefs } from '@/sprint/resolveItems'
import { isPlaceholderTranscript } from '@/sprint/reviewRefs'
import type { SprintItemRef } from '@/sprint/types'

const LETTERS = ['A', 'B', 'C', 'D']

function ListeningReviewBlock({ items }: { items: ListeningItem[] }) {
  const audioUrl = items.find((i) => i.audioUrl)?.audioUrl
  const examAudio = useExamAudio(audioUrl)

  return (
    <div className="sprint-review-block">
      {audioUrl && (
        <div className="sprint-review-audio card">
          <div className="sprint-review-audio-label">真题录音</div>
          {examAudio.loading ? (
            <p className="sprint-review-muted">录音加载中…</p>
          ) : examAudio.loadFailed ? (
            <p className="sprint-review-muted">录音未找到，请重新打包 APK</p>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => (examAudio.playing ? examAudio.stop() : examAudio.play())}
            >
              {examAudio.playing ? '■ 停止' : <><IconPlay size={16} /> 播放</>}
            </button>
          )}
        </div>
      )}

      {items.map((item) => (
        <section key={item.id} className="sprint-review-section">
          <h3 className="sprint-review-section-title">{item.title}</h3>

          {item.sentences.length > 0 && (
            <div className="sprint-review-transcript">
              {item.sentences.map((s, i) => (
                <p key={i}>{s}</p>
              ))}
            </div>
          )}

          {!item.sentences.length &&
            item.transcript &&
            !isPlaceholderTranscript(item.transcript) && (
              <div className="sprint-review-transcript">
                <p>{item.transcript}</p>
              </div>
            )}

          <ol className="sprint-review-questions">
            {item.questions.map((q) => (
              <li key={q.id} className="sprint-review-q">
                <div className="sprint-review-q-stem">{q.stem}</div>
                <ul className="sprint-review-options">
                  {q.options.map((opt, oi) => (
                    <li
                      key={oi}
                      className={
                        oi === q.answerIndex ? 'sprint-review-opt correct' : 'sprint-review-opt'
                      }
                    >
                      <strong>{LETTERS[oi]}.</strong> {opt}
                    </li>
                  ))}
                </ul>
                <div className="sprint-review-ans">{q.explanation}</div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

function ReadingReviewBlock({ items }: { items: ReadingItem[] }) {
  return (
    <div className="sprint-review-block">
      {items.map((item) => (
        <section key={item.id} className="sprint-review-section">
          <h3 className="sprint-review-section-title">{item.title}</h3>

          {item.kind === 'careful' && (
            <>
              <div className="sprint-review-passage">{item.passage}</div>
              <ol className="sprint-review-questions">
                {item.questions.map((q) => (
                  <li key={q.id} className="sprint-review-q">
                    <div className="sprint-review-q-stem">{q.stem}</div>
                    <ul className="sprint-review-options">
                      {q.options.map((opt, oi) => (
                        <li
                          key={oi}
                          className={
                            oi === q.answerIndex ? 'sprint-review-opt correct' : 'sprint-review-opt'
                          }
                        >
                          <strong>{LETTERS[oi]}.</strong> {opt}
                        </li>
                      ))}
                    </ul>
                    <div className="sprint-review-ans">{q.explanation}</div>
                  </li>
                ))}
              </ol>
            </>
          )}

          {item.kind === 'paragraph' && (
            <>
              <div className="sprint-review-passage">
                {item.paragraphs.map((p) => (
                  <p key={p.label}>
                    <strong>{p.label}.</strong> {p.text}
                  </p>
                ))}
              </div>
              <ol className="sprint-review-questions">
                {item.statements.map((s) => (
                  <li key={s.id} className="sprint-review-q">
                    <div className="sprint-review-q-stem">{s.text}</div>
                    <div className="sprint-review-ans correct">
                      答案：段落 {s.answer} · {s.explanation}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}

          {item.kind === 'word_bank' && (
            <p className="sprint-review-muted">选词填空请对照纸质卷或上一环节题目。</p>
          )}
        </section>
      ))}
    </div>
  )
}

function TranslationReviewBlock({ items }: { items: TranslationItem[] }) {
  return (
    <div className="sprint-review-block">
      {items.map((item) => (
        <section key={item.id} className="sprint-review-section">
          <h3 className="sprint-review-section-title">{item.title}</h3>
          <div className="sprint-review-transcript sprint-review-cn">
            <p className="sprint-review-label">原文</p>
            <p>{item.cn}</p>
          </div>
          <div className="sprint-review-transcript sprint-review-en">
            <p className="sprint-review-label">参考译文</p>
            <p>{item.en}</p>
          </div>
          {item.notes && <p className="sprint-review-muted">{item.notes}</p>}
        </section>
      ))}
    </div>
  )
}

function WritingReviewBlock({ items }: { items: WritingItem[] }) {
  return (
    <div className="sprint-review-block">
      {items.map((item) => (
        <section key={item.id} className="sprint-review-section">
          <h3 className="sprint-review-section-title">{item.title}</h3>
          <div className="sprint-review-transcript">
            <p className="sprint-review-label">题目</p>
            <p>{item.prompt}</p>
          </div>
          {item.sample && (
            <div className="sprint-review-transcript sprint-review-en">
              <p className="sprint-review-label">范文参考</p>
              <p>{item.sample}</p>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

export function SprintReviewPanel({ refs }: { refs: SprintItemRef[] }) {
  const resolved = useMemo(() => {
    const items = refs.flatMap((r) => resolveItemRefs(r).items)
    const missing = refs.flatMap((r) => resolveItemRefs(r).missing)
    return { items, missing }
  }, [refs])

  const listening = resolved.items.filter((i) => i.module === 'listening') as ListeningItem[]
  const reading = resolved.items
    .filter((i) => i.module === 'reading')
    .map((i) => sanitizeReadingItem(i as ReadingItem))
  const translation = resolved.items.filter((i) => i.module === 'translation') as TranslationItem[]
  const writing = resolved.items.filter((i) => i.module === 'writing') as WritingItem[]

  if (!resolved.items.length) {
    if (resolved.missing.length) {
      return (
        <p className="sprint-review-muted">
          关联题目尚未导入（{resolved.missing.slice(0, 3).join('、')}
          {resolved.missing.length > 3 ? '…' : ''}），请对照纸质卷复习。
        </p>
      )
    }
    return null
  }

  return (
    <div className="sprint-review-panel">
      <p className="sprint-review-heading">回顾材料（刚做完的题）</p>
      {listening.length > 0 && <ListeningReviewBlock items={listening} />}
      {reading.length > 0 && <ReadingReviewBlock items={reading} />}
      {translation.length > 0 && <TranslationReviewBlock items={translation} />}
      {writing.length > 0 && <WritingReviewBlock items={writing} />}
      {listening.length > 0 &&
        listening.every(
          (i) =>
            !i.sentences.length &&
            (!i.transcript || isPlaceholderTranscript(i.transcript)),
        ) && (
          <p className="sprint-review-note">
            官方真题听力多数无公开英文原文，请结合上方<strong>题目与正确答案</strong>划答案句、跟读选项。
          </p>
        )}
    </div>
  )
}
