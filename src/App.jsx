import { useState, useRef, useEffect } from 'react'
import { parseMarkdown } from './parser'
import './App.css'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getPoint(q, pointMode, customPoints) {
  if (q.point !== null && q.point !== undefined && !Number.isNaN(q.point)) return q.point
  if (pointMode === 'difficulty') return customPoints[q.difficulty] ?? 1
  return 1
}

function isCorrect(q, ans) {
  const ck = new Set(q.correct_answer)
  return ans && ans.size > 0 && ans.size === ck.size && [...ans].every(k => ck.has(k))
}

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getInitialTheme() {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function slugifyFilename(name) {
  return name
    .replace(/\.md$/i, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'quiz'
}

function formatTimestampForFilename(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`
}

function buildExportMarkdown(questions, answers, scoreMode, pointMode, customPoints, pct, passed, passPct, sourceNames) {
  const now = new Date()
  const lines = []
  lines.push(`# Kết quả bài làm — Quiz Maker`)
  lines.push('')
  if (sourceNames?.length) lines.push(`File nguồn: ${sourceNames.join(', ')}`)
  lines.push(`Ngày làm: ${now.toLocaleString('vi-VN')}`)
  lines.push(`Điểm: ${pct}% — ${passed ? 'Đạt' : 'Không đạt'} (ngưỡng ${passPct}%)`)
  if (scoreMode === 'point') {
    const maxPoint = questions.reduce((sum, qq) => sum + getPoint(qq, pointMode, customPoints), 0)
    const earnedPoint = questions.reduce((sum, qq, i) => sum + (isCorrect(qq, answers[i]) ? getPoint(qq, pointMode, customPoints) : 0), 0)
    lines.push(`Thang điểm: ${earnedPoint} / ${maxPoint} điểm`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')

  questions.forEach((q, i) => {
    const ans = answers[i] ?? new Set()
    const ck = new Set(q.correct_answer)
    const isSkipped = !ans.size
    const ok = !isSkipped && isCorrect(q, ans)
    const status = isSkipped ? 'Bỏ qua' : ok ? 'Đúng' : 'Sai'

    lines.push(`## Câu ${i + 1}: ${q.question}`)
    lines.push('')
    if (q.code) {
      lines.push('```' + (q.code_lang || ''))
      lines.push(q.code)
      lines.push('```')
      lines.push('')
    }
    lines.push(`**Kết quả: ${status}**`)
    if (!isSkipped) lines.push(`- Bạn chọn: ${[...ans].map(k => `${k}. ${q.options[k] ?? ''}`).join('; ')}`)
    lines.push(`- Đáp án đúng: ${[...ck].map(k => `${k}. ${q.options[k] ?? ''}`).join('; ')}`)
    lines.push('')
    lines.push('Giải thích')
    const explanationParts = []
    if (q.explanation) explanationParts.push(q.explanation)
    explanationParts.push(`Đáp án đúng: ${[...ck].map(k => `${q.options[k] ?? ''}`).join(', ')}.`)
    const wrongKeys = Object.keys(q.options).filter(k => !ck.has(k))
    if (wrongKeys.length) explanationParts.push(`Đáp án sai: ${wrongKeys.map(k => q.options[k]).join(', ')}.`)
    lines.push(explanationParts.join(' '))
    lines.push('')
    if (q.category) lines.push(`Lĩnh vực: ${q.category}${q.subcategory ? ' / ' + q.subcategory : ''}`)
    lines.push('')
    lines.push('---')
    lines.push('')
  })

  const snapshot = {
    savedAt: now.toISOString(),
    sourceNames: sourceNames ?? [],
    scoreMode, pointMode, customPoints, pct, passed, passPct,
    questions,
    answers: questions.map((_, i) => [...(answers[i] ?? new Set())]),
  }
  lines.push(`<!-- QUIZ_MAKER_DATA\n${JSON.stringify(snapshot)}\n-->`)

  return { content: lines.join('\n'), now }
}

function parseExportSnapshot(text) {
  const match = text.match(/<!-- QUIZ_MAKER_DATA\n([\s\S]*?)\n-->/)
  if (!match) return null
  try {
    const snapshot = JSON.parse(match[1])
    const answers = {}
    snapshot.answers.forEach((keys, i) => { answers[i] = new Set(keys) })
    return { ...snapshot, answers }
  } catch {
    return null
  }
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

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

  const goToReviewQuestion = (i) => {
    setReviewFilter('all')
    setHighlightIndex(i)
    setSelectedDotIndex(i)
    requestAnimationFrame(() => {
      document.getElementById(`review-q-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    setTimeout(() => setHighlightIndex(cur => cur === i ? null : cur), 2000)
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

  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})
  const [current, setCurrent] = useState(0)
  const [submitted, setSubmitted] = useState(false)

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
    setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null)
  }

  const buildQuiz = () => {
    let pool = allQuestions
    if (selectedCats.length > 0) pool = pool.filter(q => selectedCats.includes(q.category))
    if (mode === 'shuffle' || mode === 'random') pool = shuffle(pool)
    if (!useAll) pool = pool.slice(0, limit || pool.length)
    setQuestions(pool); setAnswers({}); setRevealed({}); setCurrent(0); setSubmitted(false)
    setTimerStarted(false); setTimerPaused(false); setTimeUp(false)
    setSecondsLeft(timerEnabled ? timerMinutes * 60 : 0)
    setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null)
  }

  const toggleCat = (cat) =>
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])

  const startTimer = () => { setTimerStarted(true); setTimerPaused(false) }
  const togglePause = () => setTimerPaused(p => !p)
  const submitQuiz = () => {
    setSubmitted(true)
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
    setSubmitted(true)
    setRevealed(prev => {
      const next = { ...prev }
      questions.forEach((_, i) => { if (!next[i]) next[i] = true })
      return next
    })
    requestAnimationFrame(() => {
      document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [timerEnabled, timerStarted, timeUp, submitted, secondsLeft, questions])

  const allDone = questions.length > 0 && (submitted || questions.every((_, i) => !!revealed[i]))

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
    if ((revealMode === 'instant' && wasAnswered) || locked) return
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
    return <ImportedResultPage snapshot={importedResult} onClose={() => setImportedResult(null)} />
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
              <button className="btn btn-danger btn-sm" onClick={submitQuiz}>Nộp bài</button>
            </div>
          </div>
        )}

        {questions.length > 0 && !needsStart && !allDone && (
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
            />
          </>
        ) : viewMode === 'scroll' ? (
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
            onSubmit={submitQuiz}
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
                <button className="btn btn-ghost" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>← Trước</button>
                <div className="nav-right">
                  {!answered ? (
                    <>
                      <button className="btn btn-ghost" onClick={skip}>Bỏ qua</button>
                      <button className="btn btn-primary" onClick={confirm} disabled={!sel.size}>Xác nhận</button>
                    </>
                  ) : current < questions.length - 1 ? (
                    <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>Tiếp theo →</button>
                  ) : (
                    <button className="btn btn-primary" onClick={submitQuiz}>Nộp bài 🏁</button>
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

            <div className="config-label" style={{ marginTop: 12 }}>Thứ tự</div>
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="shuffle">Xáo trộn (random)</option>
              <option value="category">Theo thứ tự trong file</option>
            </select>

            <div className="config-label" style={{ marginTop: 12 }}>Số câu sử dụng</div>
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
            <div className="config-label" style={{ marginTop: 14 }}>Giới hạn thời gian</div>
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
            <div className="config-label" style={{ marginTop: 14 }}>Thời điểm chấm điểm</div>
            <select value={revealMode} onChange={e => setRevealMode(e.target.value)}>
              <option value="instant">Chấm ngay sau mỗi câu</option>
              <option value="end">Chấm sau khi hoàn thành tất cả</option>
            </select>

            {/* Scoring setup */}
            <div className="config-label" style={{ marginTop: 14 }}>Cách tính điểm</div>
            <select value={scoreMode} onChange={e => setScoreMode(e.target.value)}>
              <option value="count">Đếm số câu đúng</option>
              <option value="point">Tính theo thang điểm (point)</option>
            </select>

            {scoreMode === 'point' && (
              <>
                <div className="config-label" style={{ marginTop: 10 }}>Point mặc định (khi file không set)</div>
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

            <div className="config-label" style={{ marginTop: 14 }}>Tỉ lệ đậu (pass)</div>
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
                const ok = canShowResult && ans.size > 0 && ans.size === ck.size && [...ans].every(k => ck.has(k))
                const bad = canShowResult && !ok
                const pending = wasAnswered && !canShowResult
                const isActive = allDone ? i === selectedDotIndex : i === current
                return (
                  <div key={i}
                    className={`nav-dot${isActive ? ' active' : ''}${ok ? ' dot-correct' : ''}${bad ? ' dot-wrong' : ''}${pending ? ' dot-answered' : ''}`}
                    onClick={() => allDone ? goToReviewQuestion(i) : (setCurrent(i), window.scrollTo(0, 0))}
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
            <button
              className="btn btn-ghost export-btn"
              onClick={() => {
                const sourceNames = files.map(f => f.name)
                const { content, now } = buildExportMarkdown(questions, answers, scoreMode, pointMode, customPoints, pct, passed, passPct, sourceNames)
                const baseName = sourceNames.length === 1 ? slugifyFilename(sourceNames[0]) : sourceNames.length > 1 ? 'nhieu-file' : 'quiz'
                downloadTextFile(`ket-qua_${baseName}_${formatTimestampForFilename(now)}.md`, content)
              }}
            >📥 Xuất kết quả (.md)</button>
          </div>
        )}

      </aside>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}

function CopyBlock({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="copy-block">
      <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copy}>
        {copied ? '✓ Đã copy' : '📋 Copy'}
      </button>
      <pre><code>{text}</code></pre>
    </div>
  )
}

const FULL_GUIDE = `# Quy tắc định dạng file câu hỏi (.md) — Quiz Maker

Tài liệu này mô tả chính xác định dạng file Markdown mà app Quiz Maker đọc được.
Dùng để: (1) người đọc tự viết file tay, (2) làm prompt đưa cho AI (ChatGPT, Claude...) generate bộ câu hỏi đúng chuẩn.

## Cấu trúc tổng quát

Mỗi câu hỏi là một block nằm giữa hai dấu \`---\`. Nhiều câu hỏi nối tiếp nhau trong cùng một file, phân cách bằng \`---\`.

## Các trường (field)

| Trường | Bắt buộc | Kiểu | Mô tả |
|---|---|---|---|
| id | Không | string | Định danh duy nhất, vd js-001 |
| category | Không | string | Chủ đề, vd JavaScript, React |
| subcategory | Không | string | Chủ đề con |
| difficulty | Không | enum | easy \\| medium \\| hard (mặc định medium) |
| type | Không | enum | single_choice \\| multiple_choice (mặc định single_choice) |
| question | Có | string | Nội dung câu hỏi |
| options | Có | map | Các lựa chọn dạng key: value, key thường là A, B, C, D |
| correct_answer | Có | string \\| array | Key đáp án đúng, vd A. Nếu multiple_choice thì là mảng, vd [A, C] |
| code | Không | block scalar | Đoạn code đính kèm, dùng \\| để giữ nguyên xuống dòng/indent |
| code_lang | Không | string | Ngôn ngữ code, vd dart, javascript, sql |
| explanation | Không | string | Giải thích đáp án, hiện sau khi trả lời |
| tags | Không | array | Danh sách tag, vd [react, hook, useState] |
| point | Không | number | Điểm của câu hỏi khi tính theo thang điểm. Không set thì app tự gán theo difficulty (easy=1, medium=2, hard=3) hoặc theo cấu hình lúc tạo đề |

## Ví dụ câu hỏi đơn giản (single_choice)

---
id: q1
category: JavaScript
subcategory: ES6
difficulty: medium
type: single_choice
question: Arrow function khác gì với function thường?
options:
  A: Không có this riêng
  B: Không thể có tham số
  C: Chạy nhanh hơn
  D: Không có sự khác biệt
correct_answer: A
explanation: Arrow function kế thừa this từ lexical scope bao ngoài, không có this riêng.
tags: [arrow-function, this, es6]
point: 2
---

## Ví dụ câu hỏi kèm code

---
id: dart-001
category: Dart
difficulty: medium
type: single_choice
code_lang: dart
question: What is the output of the following code?
code: |
  void main() async {
    print('A');
    await Future.delayed(Duration.zero);
    print('B');
  }
options:
  A: A B
  B: B A
correct_answer: A
explanation: await nhường event loop, nhưng B vẫn chạy sau đó.
---

## Ví dụ câu hỏi nhiều đáp án (multiple_choice)

---
id: q2
category: React
difficulty: hard
type: multiple_choice
question: Các hook nào sau đây là built-in của React?
options:
  A: useState
  B: useLocalStorage
  C: useEffect
  D: useDebounce
correct_answer: [A, C]
explanation: useState và useEffect là hook built-in. useLocalStorage và useDebounce là custom hook.
---

## Quy tắc quan trọng khi tạo file (áp dụng cho cả người viết tay lẫn AI generate)

1. correct_answer là 1 key duy nhất nếu type: single_choice, hoặc mảng [A, C] nếu type: multiple_choice.
2. Nếu câu hỏi có đoạn code riêng, dùng code_lang + code: | rồi xuống dòng, indent code sâu hơn indent của "code:".
3. Có thể dùng backtick \`...\` để inline code ngay trong question/options/explanation.
4. point là số nguyên tuỳ chọn, đại diện điểm số câu hỏi khi chấm theo thang điểm (không phải đếm số câu đúng). Nếu không chắc, cứ set theo độ khó: easy=1, medium=2, hard=3.
5. Không thêm text nào ngoài các block --- ... ---.
6. File kết quả phải là .md thuần, không bọc trong markdown code fence khi xuất ra.

---
# YÊU CẦU (điền vào phần dưới rồi gửi cho AI để generate bộ câu hỏi)

Chủ đề: <điền chủ đề bạn muốn>
Số lượng câu hỏi: <điền số lượng>
Độ khó: <easy / medium / hard / mix>
Ghi chú thêm: <ví dụ: ưu tiên câu hỏi có code, tránh trùng lặp với bộ đã có, v.v.>`

function HelpModal({ onClose }) {
  const [copied, setCopied] = useState(false)
  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(FULL_GUIDE)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = FULL_GUIDE
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📄 Định dạng file Markdown</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={`copy-all-btn${copied ? ' copied' : ''}`} onClick={copyAll}>
              {copied ? '✓ Đã copy toàn bộ' : '📋 Copy toàn bộ hướng dẫn'}
            </button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-body">
          <p className="help-intro">
            Đây là quy tắc định dạng đầy đủ — vừa để bạn đọc hiểu, vừa để dán thẳng cho AI (ChatGPT, Claude...)
            làm prompt sinh bộ câu hỏi đúng chuẩn. Bấm <strong>Copy toàn bộ hướng dẫn</strong> ở trên, điền phần
            "Chủ đề / Số lượng / Độ khó" ở cuối rồi gửi cho AI.
          </p>

          <p>Mỗi câu hỏi là một block nằm giữa hai dấu <code>---</code>. Các trường bắt buộc: <code>question</code>, <code>options</code>, <code>correct_answer</code>.</p>

          <table className="help-table">
            <thead>
              <tr><th>Trường</th><th>Bắt buộc</th><th>Mô tả</th></tr>
            </thead>
            <tbody>
              <tr><td>id</td><td>Không</td><td>Định danh câu hỏi, vd <code>q1</code></td></tr>
              <tr><td>category</td><td>Không</td><td>Chủ đề, vd <code>React</code></td></tr>
              <tr><td>subcategory</td><td>Không</td><td>Chủ đề con</td></tr>
              <tr><td>difficulty</td><td>Không</td><td><code>easy</code> / <code>medium</code> / <code>hard</code></td></tr>
              <tr><td>type</td><td>Không</td><td><code>single_choice</code> hoặc <code>multiple_choice</code></td></tr>
              <tr><td>question</td><td><strong>Có</strong></td><td>Nội dung câu hỏi</td></tr>
              <tr><td>options</td><td><strong>Có</strong></td><td>Các lựa chọn dạng key-value</td></tr>
              <tr><td>correct_answer</td><td><strong>Có</strong></td><td>Key đáp án đúng, vd <code>A</code> hoặc <code>[A, C]</code></td></tr>
              <tr><td>code</td><td>Không</td><td>Đoạn code, dùng <code>|</code> để giữ format</td></tr>
              <tr><td>code_lang</td><td>Không</td><td>Ngôn ngữ code, vd <code>dart</code></td></tr>
              <tr><td>explanation</td><td>Không</td><td>Giải thích đáp án</td></tr>
              <tr><td>tags</td><td>Không</td><td>Danh sách tag, vd <code>[react, hook]</code></td></tr>
              <tr><td>point</td><td>Không</td><td>Điểm câu hỏi khi chấm theo thang điểm, vd <code>2</code>. Không set thì tự tính theo độ khó</td></tr>
            </tbody>
          </table>

          <p style={{ marginTop: 14 }}>Toàn bộ nội dung sẽ được copy (bấm nút ở góc trên):</p>
          <CopyBlock text={FULL_GUIDE} />
        </div>
      </div>
    </div>
  )
}

function ReviewScrollView({ questions, answers, reviewFilter, scoreMode, pointMode, customPoints, highlightIndex }) {
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

function ScrollView({
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

function ImportedResultPage({ snapshot, onClose }) {
  const [filter, setFilter] = useState('all')
  const [highlightIndex, setHighlightIndex] = useState(null)
  const [selectedDotIndex, setSelectedDotIndex] = useState(null)
  const { questions, answers, scoreMode, pointMode, customPoints, pct, passed, passPct, sourceNames, savedAt } = snapshot

  const totalCorrect = questions.filter((qq, i) => isCorrect(qq, answers[i])).length
  const totalSkipped = questions.filter((_, i) => !(answers[i]?.size)).length

  const maxPoint = questions.reduce((sum, qq) => sum + getPoint(qq, pointMode, customPoints), 0)
  const earnedPoint = questions.reduce((sum, qq, i) => sum + (isCorrect(qq, answers[i]) ? getPoint(qq, pointMode, customPoints) : 0), 0)

  const goToQuestion = (i) => {
    setFilter('all')
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
          />
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
        </div>
      </aside>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text3)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>📂</div>
      <p style={{ fontSize: '1rem', marginBottom: 6, color: 'var(--text2)' }}>Chưa có câu hỏi nào</p>
      <p style={{ fontSize: '0.85rem' }}>Thêm file .md từ thanh bên phải để bắt đầu</p>
    </div>
  )
}
