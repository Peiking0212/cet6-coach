const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function MCQ({
  options,
  selected,
  answerIndex,
  revealed,
  onSelect,
}: {
  options: string[]
  selected: number | null
  answerIndex: number
  revealed: boolean
  onSelect: (i: number) => void
}) {
  return (
    <div className="mcq">
      {options.map((opt, i) => {
        let cls = 'mcq-opt'
        if (revealed) {
          if (i === answerIndex) cls += ' correct'
          else if (i === selected) cls += ' wrong'
          else cls += ' dim'
        } else if (i === selected) {
          cls += ' selected'
        }
        return (
          <button
            key={i}
            className={cls}
            onClick={() => !revealed && onSelect(i)}
            disabled={revealed}
          >
            <span className="mcq-letter">{LETTERS[i]}</span>
            <span className="mcq-text">{opt}</span>
          </button>
        )
      })}
    </div>
  )
}
