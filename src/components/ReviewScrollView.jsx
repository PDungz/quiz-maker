import { getPoint, isCorrect } from '../utils/quiz'

export default function ReviewScrollView({ questions, answers, reviewFilter, scoreMode, pointMode, customPoints, highlightIndex, selectedSet, onToggleSelect }) {
  const items = questions.map((q, i) => {
    const ans = answers[i] ?? new Set()
    const ck = new Set(q.correct_answer)
    const isSkipped = !ans.size
    const isOk = !isSkipped && isCorrect(q, ans)
    const status = isSkipped ? 'skipped' : isOk ? 'correct' : 'wrong'
    return { q, i, ans, ck, isSkipped, isOk, status }
  })
  const filtered = items.filter(it => reviewFilter === 'all' || reviewFilter === it.status)

  if (!filtered.length) {
    return <p style={{ fontSize: '0.85rem', color: 'var(--text3)', textAlign: 'center', padding: '40px 0' }}>Không có câu nào thuộc mục này</p>
  }

  return (
    <div className="scroll-view">
      {filtered.map(({ q, i, ans, ck, isSkipped, isOk, status }) => {
        const wrongKeys = Object.keys(q.options).filter(k => !ck.has(k))
        return (
          <div key={i} id={`review-q-${i}`} className={`scroll-item review-item-${status}${i === highlightIndex ? ' highlighted' : ''}`}>
            <div className="question-meta">
              {onToggleSelect && (
                <label className="retry-checkbox" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedSet?.has(i) ?? false} onChange={() => onToggleSelect(i)} />
                </label>
              )}
              <span className={`badge badge-status-${status}`}>
                {isSkipped ? '⏭ Bỏ qua' : isOk ? '✓ Đúng' : '✗ Sai'}
              </span>
              {q.category && <span className="badge badge-cat">{q.category}</span>}
              {q.difficulty && <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>}
              {scoreMode === 'point' && <span className="badge badge-point">{isOk ? getPoint(q, pointMode, customPoints) : 0}/{getPoint(q, pointMode, customPoints)} điểm</span>}
              <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text3)' }}>#{i + 1}</span>
            </div>

            <div className="question-card">
              <p className="question-text">{q.question}</p>
              {q.code && (
                <pre className="code-block">
                  {q.code_lang && <span className="code-lang">{q.code_lang}</span>}
                  <code>{q.code}</code>
                </pre>
              )}
            </div>

            <div className="options-list">
              {Object.entries(q.options).map(([key, val]) => {
                let cls = ''
                if (ck.has(key) && ans.has(key)) cls = 'correct'
                else if (!ck.has(key) && ans.has(key)) cls = 'wrong'
                else if (ck.has(key)) cls = 'reveal-correct'
                return (
                  <div key={key} className={`option-item ${cls} disabled`}>
                    <span className="option-key">{key}</span>
                    <span className="option-text">{val}</span>
                  </div>
                )
              })}
            </div>

            <div className="explanation-box">
              <h4>Giải thích</h4>
              <p>
                <strong>The Correct Answer:</strong> {[...ck].map(k => q.options[k]).join('; ')}.
                {q.explanation ? ` ${q.explanation}` : ''}
                {wrongKeys.length > 0 && (
                  <> <strong>The Incorrect Answers:</strong> {wrongKeys.map(k => q.options[k]).join('; ')}.</>
                )}
              </p>
            </div>

            {q.category && (
              <p className="review-domain">Lĩnh vực: {q.category}{q.subcategory ? ` / ${q.subcategory}` : ''}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
