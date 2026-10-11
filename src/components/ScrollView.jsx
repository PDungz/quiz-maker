import { getPoint } from '../utils/quiz'

export default function ScrollView({
  questions, answers, revealed, revealMode, allDone, locked,
  scoreMode, pointMode, customPoints,
  toggleOptionAt, getOptionClassAt, confirmAt, skipAt, onSubmit,
}) {
  const allAnswered = questions.every((_, i) => !!revealed[i])

  return (
    <div className="scroll-view">
      {questions.map((q, i) => {
        const isMulti = q.type === 'multiple_choice'
        const sel = answers[i] ?? new Set()
        const answeredQ = !!revealed[i]
        const showAnswer = (revealMode === 'instant' && answeredQ) || allDone

        return (
          <div key={i} className="scroll-item">
            <div className="question-meta">
              {q.category && <span className="badge badge-cat">{q.category}</span>}
              {q.difficulty && <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>}
              {isMulti && <span className="badge badge-multi">Nhiều đáp án</span>}
              {scoreMode === 'point' && <span className="badge badge-point">{getPoint(q, pointMode, customPoints)} điểm</span>}
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

            {isMulti && !answeredQ && <p className="multi-hint">Chọn tất cả đáp án đúng rồi bấm Xác nhận</p>}

            <div className="options-list">
              {Object.entries(q.options).map(([key, val]) => (
                <div key={key}
                  className={`option-item ${getOptionClassAt(i, key)} ${answeredQ || locked ? 'disabled' : ''}`}
                  onClick={() => toggleOptionAt(i, key)}
                >
                  <span className="option-key">{key}</span>
                  <span className="option-text">{val}</span>
                </div>
              ))}
            </div>

            {showAnswer && q.explanation && (
              <div className="explanation-box">
                <h4>Giải thích</h4>
                <p>{q.explanation}</p>
              </div>
            )}

            {!locked && !answeredQ && (
              <div className="nav-row">
                <div className="nav-right">
                  <button className="btn btn-ghost" onClick={() => skipAt(i)}>Bỏ qua</button>
                  <button className="btn btn-primary" onClick={() => confirmAt(i)} disabled={!sel.size}>Xác nhận</button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {!locked && (
        <button className="btn btn-primary submit-all-btn" onClick={onSubmit} disabled={!allAnswered}>
          {allAnswered ? 'Nộp bài 🏁' : `Còn ${questions.filter((_, i) => !revealed[i]).length} câu chưa trả lời`}
        </button>
      )}
    </div>
  )
}
