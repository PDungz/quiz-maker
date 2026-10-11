import { useState } from 'react'
import { getPoint, isCorrect, formatDuration } from '../utils/quiz'
import ReviewScrollView from './ReviewScrollView'

export default function ImportedResultPage({ snapshot, onClose, onRetry }) {
  const [filter, setFilter] = useState('all')
  const [highlightIndex, setHighlightIndex] = useState(null)
  const [selectedDotIndex, setSelectedDotIndex] = useState(null)
  const [retrySelection, setRetrySelection] = useState(() => new Set())
  const { questions, answers, scoreMode, pointMode, customPoints, pct, passed, passPct, sourceNames, savedAt, elapsedSeconds, timerEnabled, timerMinutes, startedAt } = snapshot

  const toggleRetrySelect = (i) => {
    setRetrySelection(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const totalCorrect = questions.filter((qq, i) => isCorrect(qq, answers[i])).length
  const totalSkipped = questions.filter((_, i) => !(answers[i]?.size)).length

  const maxPoint = questions.reduce((sum, qq) => sum + getPoint(qq, pointMode, customPoints), 0)
  const earnedPoint = questions.reduce((sum, qq, i) => sum + (isCorrect(qq, answers[i]) ? getPoint(qq, pointMode, customPoints) : 0), 0)

  const goToQuestion = (i) => {
    setHighlightIndex(i)
    setSelectedDotIndex(i)
    requestAnimationFrame(() => {
      document.getElementById(`review-q-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    setTimeout(() => setHighlightIndex(cur => cur === i ? null : cur), 2000)
  }

  return (
    <div className="app-layout">
      <main className="main-content">
        <div className="main-inner">
          <div className="imported-meta">
            <div className="imported-meta-head">
              <h3 style={{ margin: 0 }}>📂 Kết quả đã lưu</h3>
            </div>
            {sourceNames?.length > 0 && <div>File nguồn: <strong>{sourceNames.join(', ')}</strong></div>}
            <div>Làm lúc: <strong>{new Date(savedAt).toLocaleString('vi-VN')}</strong></div>
            <div>
              Điểm: <strong style={{ color: passed ? 'var(--success)' : 'var(--danger)' }}>{pct}%</strong>
              {' — '}{passed ? 'Đạt' : 'Không đạt'} (ngưỡng {passPct}%)
              {' · '}{totalCorrect} đúng · {questions.length - totalCorrect - totalSkipped} sai · {totalSkipped} bỏ qua
            </div>
            {elapsedSeconds != null && (
              <div>
                ⏱ Làm trong {formatDuration(elapsedSeconds)}
                {timerEnabled && ` (${Math.ceil(elapsedSeconds / 60)}/${timerMinutes} phút)`}
                {startedAt && (
                  <> · {new Date(startedAt).toLocaleTimeString('vi-VN')} — {new Date(startedAt + elapsedSeconds * 1000).toLocaleTimeString('vi-VN')}</>
                )}
              </div>
            )}
          </div>

          <div className="review-filter">
            <button className={`review-filter-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
              Tất cả <span className="review-filter-count">{questions.length}</span>
            </button>
            <button className={`review-filter-btn filter-correct${filter === 'correct' ? ' active' : ''}`} onClick={() => setFilter('correct')}>
              Đúng <span className="review-filter-count">{totalCorrect}</span>
            </button>
            <button className={`review-filter-btn filter-wrong${filter === 'wrong' ? ' active' : ''}`} onClick={() => setFilter('wrong')}>
              Sai <span className="review-filter-count">{questions.length - totalCorrect - totalSkipped}</span>
            </button>
            <button className={`review-filter-btn filter-skipped${filter === 'skipped' ? ' active' : ''}`} onClick={() => setFilter('skipped')}>
              Bỏ qua <span className="review-filter-count">{totalSkipped}</span>
            </button>
          </div>

          <ReviewScrollView
            questions={questions}
            answers={answers}
            reviewFilter={filter}
            scoreMode={scoreMode}
            pointMode={pointMode}
            customPoints={customPoints}
            highlightIndex={highlightIndex}
            selectedSet={retrySelection}
            onToggleSelect={toggleRetrySelect}
          />
          {retrySelection.size > 0 && (
            <button
              className="btn btn-primary retry-selected-btn"
              onClick={() => onRetry(questions.filter((_, i) => retrySelection.has(i)))}
            >🔁 Làm lại {retrySelection.size} câu đã chọn</button>
          )}
        </div>
      </main>

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">📝</div>
          <div className="sidebar-title">Quiz</div>
          <button className="help-btn" title="Đóng kết quả đã lưu" onClick={onClose}>✕</button>
        </div>

        <div className="nav-section">
          <div className="config-label">
            Câu hỏi <span style={{ color: passed ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{pct}%</span>
          </div>
          <div className="sidebar-nav">
            {questions.map((q, i) => {
              const ans = answers[i] ?? new Set()
              const isSkipped = !ans.size
              const ok = !isSkipped && isCorrect(q, ans)

              if (filter !== 'all') {
                const status = isSkipped ? 'skipped' : ok ? 'correct' : 'wrong'
                if (status !== filter) return null
              }

              return (
                <div key={i}
                  className={`nav-dot${i === selectedDotIndex ? ' active' : ''}${ok ? ' dot-correct' : isSkipped ? ' dot-answered' : ' dot-wrong'}`}
                  onClick={() => goToQuestion(i)}
                >{i + 1}</div>
              )
            })}
          </div>
        </div>

        <div className="result-mini">
          <div style={{ fontSize: '2rem', fontWeight: 800, color: passed ? 'var(--success)' : 'var(--danger)' }}>{pct}%</div>
          <div className={`pass-tag ${passed ? 'pass' : 'fail'}`}>{passed ? '✓ Đạt' : '✗ Không đạt'} (ngưỡng {passPct}%)</div>
          {scoreMode === 'point' && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 2 }}>{earnedPoint} / {maxPoint} điểm</div>
          )}
          <div style={{ fontSize: '0.82rem', color: 'var(--text2)', marginTop: 4 }}>
            <span style={{ color: 'var(--success)' }}>{totalCorrect} đúng</span>
            {' · '}
            <span style={{ color: 'var(--danger)' }}>{questions.length - totalCorrect - totalSkipped} sai</span>
            {' · '}
            <span style={{ color: 'var(--text3)' }}>{totalSkipped} bỏ qua</span>
          </div>
          {elapsedSeconds != null && (
            <div className="time-taken">
              ⏱ Làm trong {formatDuration(elapsedSeconds)}
              {timerEnabled && ` (${Math.ceil(elapsedSeconds / 60)}/${timerMinutes} phút)`}
              {startedAt && (
                <div>
                  {new Date(startedAt).toLocaleTimeString('vi-VN')} — {new Date(startedAt + elapsedSeconds * 1000).toLocaleTimeString('vi-VN')}
                </div>
              )}
            </div>
          )}
          {(questions.length - totalCorrect) > 0 && (
            <button
              className="btn btn-ghost retry-wrong-btn"
              onClick={() => onRetry(questions.filter((qq, i) => !isCorrect(qq, answers[i])))}
            >🔁 Làm lại {questions.length - totalCorrect} câu sai + bỏ qua</button>
          )}
        </div>
      </aside>
    </div>
  )
}
