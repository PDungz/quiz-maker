import { useState, useRef, useEffect } from 'react'
import { parseMarkdown } from './parser'
import './App.css'
import { shuffle, getPoint, isCorrect, formatTime, formatDuration } from './utils/quiz'
import { getInitialTheme } from './utils/theme'
import { slugifyFilename, formatTimestampForFilename, buildExportMarkdown, parseExportSnapshot, downloadTextFile } from './utils/export'
import EmptyState from './components/EmptyState'
import HelpModal from './components/HelpModal'
import ConfirmSubmitModal from './components/ConfirmSubmitModal'
import ReviewScrollView from './components/ReviewScrollView'
import ScrollView from './components/ScrollView'
import ImportedResultPage from './components/ImportedResultPage'

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState('single') // 'single' | 'scroll'
  const [reviewFilter, setReviewFilter] = useState('all') // 'all' | 'correct' | 'wrong' | 'skipped'
  const [highlightIndex, setHighlightIndex] = useState(null)
  const [selectedDotIndex, setSelectedDotIndex] = useState(null)
  const [retrySelection, setRetrySelection] = useState(() => new Set())

  const goToReviewQuestion = (i) => {
    setHighlightIndex(i)
    setSelectedDotIndex(i)
    requestAnimationFrame(() => {
      document.getElementById(`review-q-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    setTimeout(() => setHighlightIndex(cur => cur === i ? null : cur), 2000)
  }

  const toggleRetrySelect = (i) => {
    setRetrySelection(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const [allQuestions, setAllQuestions] = useState([])
  const [files, setFiles] = useState([])
  const fileRef = useRef()
  const [dragOver, setDragOver] = useState(false)

  const [showHelp, setShowHelp] = useState(false)
  const [importedResult, setImportedResult] = useState(null)
  const importResultRef = useRef()

  const loadResultFile = (fileList) => {
    const file = fileList?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      const snapshot = parseExportSnapshot(e.target.result)
      if (!snapshot) {
        alert('File này không phải kết quả hợp lệ do Quiz Maker xuất ra.')
        return
      }
      setImportedResult(snapshot)
    }
    reader.readAsText(file)
  }

  const [selectedCats, setSelectedCats] = useState([])
  const [mode, setMode] = useState('shuffle')
  const [useAll, setUseAll] = useState(true)
  const [limit, setLimit] = useState(20)

  // ── Timer setup ──
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(15)
  const [examMode, setExamMode] = useState(false) // true = thi thật, không cho dừng
  const [timerStarted, setTimerStarted] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [timeUp, setTimeUp] = useState(false)

  // ── Scoring setup ──
  const [revealMode, setRevealMode] = useState('instant') // 'instant' | 'end'
  const [scoreMode, setScoreMode] = useState('count') // 'count' | 'point'
  const [pointMode, setPointMode] = useState('fixed') // 'fixed' | 'difficulty'
  const [customPoints, setCustomPoints] = useState({ easy: 1, medium: 2, hard: 3 })
  const [passPct, setPassPct] = useState(70)

  const [lockPrevious, setLockPrevious] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)

  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})
  const [current, setCurrent] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(null)

  const categories = [...new Set(allQuestions.map(q => q.category).filter(Boolean))]

  const loadFiles = (fileList) => {
    let pending = Array.from(fileList).filter(f => f.name.endsWith('.md')).length
    if (!pending) return
    const incoming = []
    const newFiles = []
    Array.from(fileList).forEach(file => {
      if (!file.name.endsWith('.md')) return
      const reader = new FileReader()
      reader.onload = e => {
        const qs = parseMarkdown(e.target.result)
        incoming.push(...qs)
        newFiles.push({ name: file.name, count: qs.length })
        if (--pending === 0) {
          setAllQuestions(prev => {
            const merged = [...prev]
            incoming.forEach(q => { if (!merged.find(x => x.id && x.id === q.id)) merged.push(q) })
            return merged
          })
          setFiles(prev => [...prev, ...newFiles.filter(nf => !prev.find(p => p.name === nf.name))])
        }
      }
      reader.readAsText(file)
    })
  }

  const clearAll = () => {
    setAllQuestions([]); setFiles([])
    resetQuiz()
  }

  const resetQuiz = () => {
    setQuestions([]); setAnswers({}); setRevealed({}); setCurrent(0); setSubmitted(false)
    setTimerStarted(false); setTimerPaused(false); setTimeUp(false); setSecondsLeft(0)
    setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null); setRetrySelection(new Set())
    setStartedAt(null); setElapsedSeconds(null)
  }

  const buildQuiz = () => {
    let pool = allQuestions
    if (selectedCats.length > 0) pool = pool.filter(q => selectedCats.includes(q.category))
    if (mode === 'shuffle' || mode === 'random') pool = shuffle(pool)
    if (!useAll) pool = pool.slice(0, limit || pool.length)
    setQuestions(pool); setAnswers({}); setRevealed({}); setCurrent(0); setSubmitted(false)
    setTimerStarted(false); setTimerPaused(false); setTimeUp(false)
    setSecondsLeft(timerEnabled ? timerMinutes * 60 : 0)
    setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null); setRetrySelection(new Set())
    setStartedAt(timerEnabled ? null : Date.now()); setElapsedSeconds(null)
  }

  const toggleCat = (cat) =>
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])

  const startRetry = (subset) => {
    if (!subset.length) return
    const pool = mode === 'shuffle' || mode === 'random' ? shuffle(subset) : subset
    setQuestions(pool); setAnswers({}); setRevealed({}); setCurrent(0); setSubmitted(false)
    setTimerStarted(false); setTimerPaused(false); setTimeUp(false)
    setSecondsLeft(timerEnabled ? timerMinutes * 60 : 0)
    setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null); setRetrySelection(new Set())
    setStartedAt(timerEnabled ? null : Date.now()); setElapsedSeconds(null)
    setImportedResult(null)
    requestAnimationFrame(() => {
      document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const startTimer = () => { setTimerStarted(true); setTimerPaused(false); setStartedAt(Date.now()) }
  const togglePause = () => setTimerPaused(p => !p)

  const requestSubmit = () => setConfirmSubmit(true)
  const cancelSubmit = () => setConfirmSubmit(false)
  const confirmAndSubmit = () => { setConfirmSubmit(false); finalizeSubmit() }

  const finalizeSubmit = () => {
    setSubmitted(true)
    setElapsedSeconds(startedAt ? Math.round((Date.now() - startedAt) / 1000) : null)
    setRevealed(prev => {
      const next = { ...prev }
      questions.forEach((_, i) => { if (!next[i]) next[i] = true })
      return next
    })
    requestAnimationFrame(() => {
      document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  // ── Countdown tick ──
  useEffect(() => {
    if (!timerEnabled || !timerStarted || timerPaused || timeUp || submitted || secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timerEnabled, timerStarted, timerPaused, timeUp, submitted, secondsLeft])

  // ── Time's up → auto-submit ──
  useEffect(() => {
    if (!timerEnabled || !timerStarted || timeUp || submitted || secondsLeft > 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external countdown timer finishing
    setTimeUp(true)
    setConfirmSubmit(false)
    finalizeSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finalizeSubmit is stable per-render and intentionally omitted to avoid re-running on every answer change
  }, [timerEnabled, timerStarted, timeUp, submitted, secondsLeft])

  const allDone = questions.length > 0 && submitted

  const q = questions[current]
  const isMulti = q?.type === 'multiple_choice'
  const sel = answers[current] ?? new Set()
  const answered = !!revealed[current]
  const locked = submitted || timeUp
  const showAnswer = (revealMode === 'instant' && answered) || allDone
  const isRevealed = showAnswer

  const toggleOptionAt = (idx, key) => {
    const qq = questions[idx]
    const isMultiQ = qq?.type === 'multiple_choice'
    const wasAnswered = !!revealed[idx]
    if ((revealMode === 'instant' && wasAnswered) || (lockPrevious && wasAnswered) || locked) return
    setAnswers(prev => {
      const s = new Set(prev[idx] ?? [])
      if (isMultiQ) { s.has(key) ? s.delete(key) : s.add(key) } else { s.clear(); s.add(key) }
      return { ...prev, [idx]: s }
    })
  }
  const toggleOption = (key) => toggleOptionAt(current, key)

  const confirmAt = (idx) => {
    const ans = answers[idx] ?? new Set()
    if (!ans.size || locked) return
    setRevealed(prev => ({ ...prev, [idx]: true }))
    if (revealMode === 'end' && viewMode === 'single' && idx < questions.length - 1) setCurrent(c => c + 1)
  }
  const confirm = () => confirmAt(current)

  const skipAt = (idx) => {
    if (locked) return
    setRevealed(prev => ({ ...prev, [idx]: true }))
    if (revealMode === 'end' && viewMode === 'single' && idx < questions.length - 1) setCurrent(c => c + 1)
  }
  const skip = () => skipAt(current)

  const getOptionClassAt = (idx, key) => {
    const qq = questions[idx]
    const ansIdx = answers[idx] ?? new Set()
    const ckIdx = qq ? new Set(qq.correct_answer) : new Set()
    const answeredIdx = !!revealed[idx]
    const showAnswerIdx = (revealMode === 'instant' && answeredIdx) || allDone
    if (!showAnswerIdx) return ansIdx.has(key) ? 'selected' : ''
    if (ckIdx.has(key) && ansIdx.has(key)) return 'correct'
    if (!ckIdx.has(key) && ansIdx.has(key)) return 'wrong'
    if (ckIdx.has(key)) return 'reveal-correct'
    return ''
  }
  const getOptionClass = (key) => getOptionClassAt(current, key)

  const totalCorrect = questions.filter((qq, i) => isCorrect(qq, answers[i])).length
  const totalSkipped = questions.filter((_, i) => revealed[i] && !(answers[i]?.size)).length
  const pctCount = questions.length ? Math.round((totalCorrect / questions.length) * 100) : 0

  const maxPoint = questions.reduce((sum, qq) => sum + getPoint(qq, pointMode, customPoints), 0)
  const earnedPoint = questions.reduce((sum, qq, i) => sum + (isCorrect(qq, answers[i]) ? getPoint(qq, pointMode, customPoints) : 0), 0)
  const pctPoint = maxPoint ? Math.round((earnedPoint / maxPoint) * 100) : 0

  const pct = scoreMode === 'point' ? pctPoint : pctCount
  const passed = pct >= passPct

  const poolSize = allQuestions.filter(q => selectedCats.length === 0 || selectedCats.includes(q.category)).length

  const needsStart = timerEnabled && questions.length > 0 && !timerStarted && !allDone

  if (importedResult) {
    return <ImportedResultPage snapshot={importedResult} onClose={() => setImportedResult(null)} onRetry={startRetry} />
  }

  return (
    <div className="app-layout">

      {/* ══ MAIN: câu hỏi bên trái ══ */}
      <main className={`main-content${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        {sidebarCollapsed && (
          <button
            className="sidebar-expand-btn"
            title="Mở lại thanh cài đặt"
            onClick={() => setSidebarCollapsed(false)}
          >⚙</button>
        )}
        <div className="main-inner">

        {timerEnabled && questions.length > 0 && timerStarted && !allDone && (
          <div className={`timer-bar${secondsLeft <= 30 ? ' timer-danger' : ''}${timerPaused ? ' timer-paused' : ''}`}>
            <span className="timer-icon">⏱</span>
            <span className="timer-time">{formatTime(secondsLeft)}</span>
            {timerPaused && <span className="timer-tag">Đã dừng</span>}
            <div className="timer-actions">
              {!examMode && (
                <button className="btn btn-ghost btn-sm" onClick={togglePause}>
                  {timerPaused ? '▶ Tiếp tục' : '⏸ Dừng'}
                </button>
              )}
              <button className="btn btn-danger btn-sm" onClick={requestSubmit}>Nộp bài</button>
            </div>
          </div>
        )}

        {questions.length > 0 && !needsStart && !allDone && !lockPrevious && (
          <div className="view-toggle">
            <button className={`view-toggle-btn${viewMode === 'single' ? ' active' : ''}`} onClick={() => setViewMode('single')}>Từng câu</button>
            <button className={`view-toggle-btn${viewMode === 'scroll' ? ' active' : ''}`} onClick={() => setViewMode('scroll')}>Scroll tất cả</button>
          </div>
        )}

        {needsStart ? (
          <div className="start-gate">
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏱</div>
            <p style={{ fontSize: '1rem', color: 'var(--text)', marginBottom: 6 }}>
              Đề thi có giới hạn {timerMinutes} phút {examMode && '· Chế độ thi thật — không thể dừng giờ'}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text3)', marginBottom: 20 }}>
              Nhấn Bắt đầu để tính giờ làm bài
            </p>
            <button className="btn btn-primary" onClick={startTimer}>▶ Bắt đầu làm bài</button>
          </div>
        ) : questions.length === 0 ? <EmptyState /> : allDone ? (
          <>
            {timeUp && (
              <div className="timeup-banner">⏰ Đã hết giờ — bài làm được tự động nộp</div>
            )}
            <div className="review-filter">
              <button className={`review-filter-btn${reviewFilter === 'all' ? ' active' : ''}`} onClick={() => setReviewFilter('all')}>
                Tất cả <span className="review-filter-count">{questions.length}</span>
              </button>
              <button className={`review-filter-btn filter-correct${reviewFilter === 'correct' ? ' active' : ''}`} onClick={() => setReviewFilter('correct')}>
                Đúng <span className="review-filter-count">{totalCorrect}</span>
              </button>
              <button className={`review-filter-btn filter-wrong${reviewFilter === 'wrong' ? ' active' : ''}`} onClick={() => setReviewFilter('wrong')}>
                Sai <span className="review-filter-count">{questions.length - totalCorrect - totalSkipped}</span>
              </button>
              <button className={`review-filter-btn filter-skipped${reviewFilter === 'skipped' ? ' active' : ''}`} onClick={() => setReviewFilter('skipped')}>
                Bỏ qua <span className="review-filter-count">{totalSkipped}</span>
              </button>
            </div>
            <ReviewScrollView
              questions={questions}
              answers={answers}
              reviewFilter={reviewFilter}
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
                onClick={() => startRetry(questions.filter((_, i) => retrySelection.has(i)))}
              >🔁 Làm lại {retrySelection.size} câu đã chọn</button>
            )}
          </>
        ) : viewMode === 'scroll' && !lockPrevious ? (
          <ScrollView
            questions={questions}
            answers={answers}
            revealed={revealed}
            revealMode={revealMode}
            allDone={allDone}
            locked={locked}
            scoreMode={scoreMode}
            pointMode={pointMode}
            customPoints={customPoints}
            toggleOptionAt={toggleOptionAt}
            getOptionClassAt={getOptionClassAt}
            confirmAt={confirmAt}
            skipAt={skipAt}
            onSubmit={requestSubmit}
          />
        ) : (
          <div>
            {timeUp && (
              <div className="timeup-banner">⏰ Đã hết giờ — bài làm được tự động nộp</div>
            )}

            <div className="question-meta">
              {q.category && <span className="badge badge-cat">{q.category}</span>}
              {q.difficulty && <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>}
              {isMulti && <span className="badge badge-multi">Nhiều đáp án</span>}
              {scoreMode === 'point' && <span className="badge badge-point">{getPoint(q, pointMode, customPoints)} điểm</span>}
              {q.id && <span className="badge badge-id">{q.id}</span>}
              <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text3)' }}>
                {current + 1} / {questions.length}
              </span>
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

            {isMulti && !answered && <p className="multi-hint">Chọn tất cả đáp án đúng rồi bấm Xác nhận</p>}

            <div className="options-list">
              {Object.entries(q.options).map(([key, val]) => (
                <div key={key}
                  className={`option-item ${getOptionClass(key)} ${answered || locked ? 'disabled' : ''}`}
                  onClick={() => toggleOption(key)}
                >
                  <span className="option-key">{key}</span>
                  <span className="option-text">{val}</span>
                </div>
              ))}
            </div>

            {isRevealed && q.explanation && (
              <div className="explanation-box">
                <h4>Giải thích</h4>
                <p>{q.explanation}</p>
              </div>
            )}

            {!locked && (
              <div className="nav-row">
                {lockPrevious ? <span /> : (
                  <button className="btn btn-ghost" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>← Trước</button>
                )}
                <div className="nav-right">
                  {!answered ? (
                    <>
                      <button className="btn btn-ghost" onClick={skip}>Bỏ qua</button>
                      <button className="btn btn-primary" onClick={confirm} disabled={!sel.size}>Xác nhận</button>
                    </>
                  ) : current < questions.length - 1 ? (
                    <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>Tiếp theo →</button>
                  ) : (
                    <button className="btn btn-primary" onClick={requestSubmit}>Nộp bài 🏁</button>
                  )}
                </div>
              </div>
            )}

            {locked && !allDone && (
              <div className="nav-row">
                <button className="btn btn-ghost" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>← Trước</button>
                <button className="btn btn-ghost" onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))} disabled={current === questions.length - 1}>Sau →</button>
              </div>
            )}
          </div>
        )}
        </div>
      </main>

      {/* ══ SIDEBAR: config bên phải ══ */}
      <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>

        <div className="sidebar-header">
          <div className="logo">📝</div>
          <div className="sidebar-title">Quiz</div>
          <button
            className="theme-btn"
            title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          >{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button
            className="help-btn"
            title="Hướng dẫn format file .md"
            onClick={() => setShowHelp(true)}
          >?</button>
          <button
            className="collapse-btn"
            title="Thu nhỏ thanh cài đặt"
            onClick={() => setSidebarCollapsed(true)}
          >»</button>
        </div>

        {/* Upload */}
        <div
          className={`upload-mini${dragOver ? ' drag-over' : ''}`}
          onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); loadFiles(e.dataTransfer.files) }}
        >
          + Thêm file .md
          <input ref={fileRef} type="file" accept=".md" multiple style={{ display: 'none' }}
            onChange={e => loadFiles(e.target.files)} />
        </div>
        <button className="import-result-btn" onClick={() => importResultRef.current.click()}>
          📂 Mở lại kết quả đã lưu
          <input ref={importResultRef} type="file" accept=".md" style={{ display: 'none' }}
            onChange={e => { loadResultFile(e.target.files); e.target.value = '' }} />
        </button>
        <div className="help-link" onClick={() => setShowHelp(true)}>
          ℹ️ Xem hướng dẫn định dạng file .md
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="file-list">
            {files.map(f => (
              <div key={f.name} className="file-item">
                <span className="file-name" title={f.name}>{f.name}</span>
                <span className="file-count">{f.count} câu</span>
              </div>
            ))}
            <div className="file-total">Tổng cộng: <strong>{allQuestions.length} câu</strong></div>
            <button className="btn-clear" onClick={clearAll}>Xoá tất cả</button>
          </div>
        )}

        {/* Config */}
        {allQuestions.length > 0 && (
          <div className="config-block">
            <div className="config-label">Chủ đề</div>
            <div className="cat-chips">
              {categories.map(cat => (
                <span key={cat} className={`tag-chip${selectedCats.includes(cat) ? ' active' : ''}`}
                  onClick={() => toggleCat(cat)}>{cat}</span>
              ))}
            </div>

            <div className="config-label">Thứ tự</div>
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="shuffle">Xáo trộn (random)</option>
              <option value="category">Theo thứ tự trong file</option>
            </select>

            <div className="config-label">Số câu sử dụng</div>
            <label className="checkbox-row">
              <input type="checkbox" checked={useAll} onChange={e => setUseAll(e.target.checked)} />
              Dùng tất cả ({poolSize} câu)
            </label>
            {!useAll && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <input type="number" min={1} max={poolSize} value={limit}
                  onChange={e => setLimit(Math.max(1, Math.min(poolSize, +e.target.value)))} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>/ {poolSize}</span>
              </div>
            )}

            {/* Timer setup */}
            <div className="config-label">Giới hạn thời gian</div>
            <label className="checkbox-row">
              <input type="checkbox" checked={timerEnabled} onChange={e => setTimerEnabled(e.target.checked)} />
              Bật đếm giờ
            </label>
            {timerEnabled && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <input type="number" min={1} max={600} value={timerMinutes}
                    onChange={e => setTimerMinutes(Math.max(1, +e.target.value))} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>phút</span>
                </div>
                <label className="checkbox-row" style={{ marginTop: 6 }}>
                  <input type="checkbox" checked={examMode} onChange={e => setExamMode(e.target.checked)} />
                  Chế độ thi thật (không thể dừng giờ)
                </label>
              </>
            )}

            {/* Reveal mode setup */}
            <div className="config-label">Thời điểm chấm điểm</div>
            <select value={revealMode} onChange={e => setRevealMode(e.target.value)}>
              <option value="instant">Chấm ngay sau mỗi câu</option>
              <option value="end">Chấm sau khi hoàn thành tất cả</option>
            </select>

            <label className="checkbox-row" style={{ marginTop: 10 }}>
              <input type="checkbox" checked={lockPrevious} onChange={e => setLockPrevious(e.target.checked)} />
              Không cho xem/sửa lại câu đã trả lời
            </label>

            {/* Scoring setup */}
            <div className="config-label">Cách tính điểm</div>
            <select value={scoreMode} onChange={e => setScoreMode(e.target.value)}>
              <option value="count">Đếm số câu đúng</option>
              <option value="point">Tính theo thang điểm (point)</option>
            </select>

            {scoreMode === 'point' && (
              <>
                <div className="config-label">Point mặc định (khi file không set)</div>
                <select value={pointMode} onChange={e => setPointMode(e.target.value)}>
                  <option value="fixed">Mỗi câu 1 điểm</option>
                  <option value="difficulty">Theo độ khó</option>
                </select>
                {pointMode === 'difficulty' && (
                  <div className="point-grid">
                    {['easy', 'medium', 'hard'].map(d => (
                      <div key={d} className="point-item">
                        <span className={`badge badge-${d}`}>{d}</span>
                        <input type="number" min={0} value={customPoints[d]}
                          onChange={e => setCustomPoints(prev => ({ ...prev, [d]: Math.max(0, +e.target.value) }))} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="config-label">Tỉ lệ đậu (pass)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" min={1} max={100} value={passPct}
                onChange={e => setPassPct(Math.max(1, Math.min(100, +e.target.value)))} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>%</span>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={buildQuiz}>
              {questions.length > 0 ? '↺ Gen lại' : 'Bắt đầu'}
            </button>
          </div>
        )}

        {/* Nav dots */}
        {questions.length > 0 && (
          <div className="nav-section">
            <div className="config-label">
              Câu hỏi {allDone && <span style={{ color: passed ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{pct}%</span>}
            </div>
            <div className="sidebar-nav">
              {questions.map((_, i) => {
                const ans = answers[i] ?? new Set()
                const wasAnswered = !!revealed[i]
                const canShowResult = wasAnswered && (revealMode === 'instant' || allDone)
                const ck = new Set(questions[i].correct_answer)
                const isSkipped = !ans.size
                const ok = canShowResult && !isSkipped && ans.size === ck.size && [...ans].every(k => ck.has(k))
                const bad = canShowResult && !isSkipped && !ok
                const pending = wasAnswered && !canShowResult

                if (allDone && reviewFilter !== 'all') {
                  const status = isSkipped ? 'skipped' : ok ? 'correct' : 'wrong'
                  if (status !== reviewFilter) return null
                }

                const isActive = allDone ? i === selectedDotIndex : i === current
                const navLocked = !allDone && lockPrevious && wasAnswered && i !== current
                return (
                  <div key={i}
                    className={`nav-dot${isActive ? ' active' : ''}${ok ? ' dot-correct' : ''}${bad ? ' dot-wrong' : ''}${pending ? ' dot-answered' : ''}${navLocked ? ' dot-locked' : ''}`}
                    onClick={() => { if (navLocked) return; allDone ? goToReviewQuestion(i) : (setCurrent(i), window.scrollTo(0, 0)) }}
                  >{i + 1}</div>
                )
              })}
            </div>
          </div>
        )}

        {/* Kết quả tổng khi xong */}
        {allDone && (
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
                onClick={() => startRetry(questions.filter((qq, i) => !isCorrect(qq, answers[i])))}
              >🔁 Làm lại {questions.length - totalCorrect} câu sai + bỏ qua</button>
            )}
            <button
              className="btn btn-ghost export-btn"
              onClick={() => {
                const sourceNames = files.map(f => f.name)
                const { content, now } = buildExportMarkdown(questions, answers, scoreMode, pointMode, customPoints, pct, passed, passPct, sourceNames, elapsedSeconds, timerEnabled, timerMinutes, startedAt)
                const baseName = sourceNames.length === 1 ? slugifyFilename(sourceNames[0]) : sourceNames.length > 1 ? 'nhieu-file' : 'quiz'
                downloadTextFile(`ket-qua_${baseName}_${formatTimestampForFilename(now)}.md`, content)
              }}
            >📥 Xuất kết quả (.md)</button>
          </div>
        )}

      </aside>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {confirmSubmit && (
        <ConfirmSubmitModal
          unansweredCount={questions.filter((_, i) => !revealed[i]).length}
          onConfirm={confirmAndSubmit}
          onCancel={cancelSubmit}
        />
      )}
    </div>
  )
}
