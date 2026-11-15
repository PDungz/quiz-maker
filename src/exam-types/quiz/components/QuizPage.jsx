import { useState, useRef, useEffect } from 'react'
import { formatTime, shuffle } from '../../../utils/quiz'
import { slugifyFilename, formatTimestampForFilename, buildExportMarkdown, parseExportSnapshot, downloadTextFile, buildProgressMarkdown, parseProgressSnapshot, buildResultSnapshot } from '../../../utils/export'
import { saveSession, loadSession, clearSession } from '../../../utils/persist'
import EmptyState from '../../../components/EmptyState'
import ConfirmSubmitModal from '../../../components/ConfirmSubmitModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useFileLibrary } from '../../../features/file-library'
import { useQuizSession, useTimer, canShowAnswer, canShowNavDotResult } from '../../../features/quiz-session'
import { useRetryFlow, RetryExportConfirmModal } from '../../../features/retry-flow'
import { useRetrySelection, computeScoring, ResultsPage, ResultsContent, ResultSidebarSummary } from '../../../features/results'
import { useQuizConfig } from '../hooks/useQuizConfig'
import ScrollView from './ScrollView'
import QuestionView from './QuestionView'
import QuizSetupSidebar from './QuizSetupSidebar'
import QuizHelpModal from './QuizHelpModal'

// Đọc session đã lưu một lần duy nhất lúc module load, dùng làm giá trị khởi tạo cho các hook bên dưới
const saved = loadSession() ?? {}

const navDotClass = ({ isActive, ok, bad, pending, navLocked }) => {
  let c = 'w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold border transition-colors '
  if (navLocked) return c + 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground border-border'
  c += 'cursor-pointer '
  if (ok) c += 'bg-success text-success-foreground border-success'
  else if (bad) c += 'bg-destructive text-white border-destructive'
  else if (pending) c += 'border-ring text-foreground bg-muted'
  else c += 'bg-muted text-muted-foreground border-border hover:text-foreground hover:border-ring'
  if (isActive) c += ' outline outline-2 outline-ring outline-offset-1'
  return c
}

// Trang làm bài kiểu Quiz thường: layout 2 cột (câu hỏi/kết quả bên trái, cấu hình bên phải),
// dùng các luồng chung (file-library, quiz-session, results, retry-flow) + UI/config riêng của Quiz.
export default function QuizPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 640)
  const [showHelp, setShowHelp] = useState(false)
  const [viewMode, setViewMode] = useState('single') // 'single' | 'scroll'
  const [reviewFilter, setReviewFilter] = useState('all') // 'all' | 'correct' | 'wrong' | 'skipped'
  const [highlightIndex, setHighlightIndex] = useState(null)
  const [selectedDotIndex, setSelectedDotIndex] = useState(null)
  const { retrySelection, setRetrySelection, toggleRetrySelect, selectManyRetry } = useRetrySelection()

  const goToReviewQuestion = (i) => {
    setHighlightIndex(i)
    setSelectedDotIndex(i)
    requestAnimationFrame(() => {
      document.getElementById(`review-q-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    setTimeout(() => setHighlightIndex(cur => cur === i ? null : cur), 2000)
  }

  const { allQuestions, setAllQuestions, files, setFiles, categories, loadFiles, removeFile, clearAll: clearFileLibrary } = useFileLibrary(saved)
  const fileRef = useRef()
  const [dragOver, setDragOver] = useState(false)

  const [importedResult, setImportedResult] = useState(null)
  const importResultRef = useRef()
  const importProgressRef = useRef()

  const config = useQuizConfig(saved)
  const {
    selectedCats, toggleCat, mode, setMode, useAll, setUseAll, limit, setLimit,
    timerEnabled, setTimerEnabled, timerMinutes, setTimerMinutes, examMode, setExamMode,
    revealMode, setRevealMode, scoreMode, setScoreMode, pointMode, setPointMode,
    customPoints, setCustomPoints, passPct, setPassPct, lockPrevious, setLockPrevious,
  } = config

  const retryFlow = useRetryFlow(saved)
  const {
    retryPool, setRetryPool, previousResult, setPreviousResult, hasExported, setHasExported,
    pendingRetrySubset, setPendingRetrySubset, pendingRetrySourceSnapshot, setPendingRetrySourceSnapshot,
    showPreviousResult, setShowPreviousResult, clearPendingRetry, resetRetryFlow,
  } = retryFlow

  const session = useQuizSession({ saved, revealMode, examMode, lockPrevious, viewMode })
  const {
    questions, setQuestions, answers, setAnswers, revealed, setRevealed, current, setCurrent, submitted, setSubmitted,
    allDone, effectiveRevealMode, toggleOptionAt, confirmAt, skipAt, getOptionStatusAt, resetSession, finalizeSubmit: finalizeSessionSubmit,
  } = session

  const [confirmSubmit, setConfirmSubmit] = useState(false)

  const finalizeSubmit = () => {
    finalizeSessionSubmit()
    timer.finalizeElapsed()
    requestAnimationFrame(() => {
      document.querySelector('#quiz-main-content')?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const timer = useTimer({ saved, timerEnabled, timerMinutes, submitted, onTimeUp: () => { setConfirmSubmit(false); finalizeSubmit() } })
  const {
    timerStarted, timerPaused, secondsLeft, timeUp,
    startedAt, elapsedSeconds, pausedMs, pauseStartedAt,
    startTimer, togglePause, resetTimer, armTimer, pausedMsAtNow,
  } = timer

  const requestSubmit = () => setConfirmSubmit(true)
  const cancelSubmit = () => setConfirmSubmit(false)
  const confirmAndSubmit = () => { setConfirmSubmit(false); finalizeSubmit() }

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

  const loadProgressFile = (fileList) => {
    const file = fileList?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      const snap = parseProgressSnapshot(e.target.result)
      if (!snap) {
        alert('File này không phải bài làm dang dở hợp lệ do Quiz Maker xuất ra.')
        return
      }
      setImportedResult(null)
      setAllQuestions(prev => {
        const merged = [...prev]
        snap.questions.forEach(q => { if (!merged.find(x => x.id && x.id === q.id)) merged.push(q) })
        return merged
      })
      if (snap.sourceNames?.length) {
        setFiles(prev => {
          const names = new Set(prev.map(f => f.name))
          const added = snap.sourceNames.filter(n => !names.has(n)).map(n => ({ name: n, count: 0 }))
          return [...prev, ...added]
        })
      }
      setQuestions(snap.questions)
      setAnswers(snap.answers)
      setRevealed(snap.revealed ?? {})
      setCurrent(snap.current ?? 0)
      setSubmitted(false)
      setMode(snap.mode ?? 'shuffle')
      setUseAll(snap.useAll ?? true)
      setLimit(snap.limit ?? 20)
      setTimerEnabled(!!snap.timerEnabled)
      setTimerMinutes(snap.timerMinutes ?? 15)
      setExamMode(!!snap.examMode)
      timer.setSecondsLeft(snap.secondsLeft ?? 0)
      timer.setTimerStarted(!!snap.timerStarted)
      timer.setTimerPaused(!!snap.timerPaused)
      timer.setTimeUp(false)
      setRevealMode(snap.revealMode ?? 'instant')
      setScoreMode(snap.scoreMode ?? 'count')
      setPointMode(snap.pointMode ?? 'fixed')
      setCustomPoints(snap.customPoints ?? { easy: 1, medium: 2, hard: 3 })
      setPassPct(snap.passPct ?? 70)
      setLockPrevious(!!snap.lockPrevious)
      timer.setStartedAt(snap.startedAt ?? null)
      timer.setElapsedSeconds(null)
      timer.setPausedMs(snap.pausedMs ?? 0)
      // nếu lúc lưu đang dừng, tiếp tục đếm "dừng" từ bây giờ cho đến khi bấm Tiếp tục
      timer.setPauseStartedAt(snap.timerPaused ? Date.now() : null)
      setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null); setRetrySelection(new Set())
      requestAnimationFrame(() => {
        document.querySelector('#quiz-main-content')?.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
    reader.readAsText(file)
  }

  const resetQuiz = () => {
    resetSession()
    resetTimer()
    setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null); setRetrySelection(new Set())
    resetRetryFlow()
  }

  const clearAll = () => {
    clearFileLibrary()
    resetQuiz()
    clearSession()
  }

  const buildQuiz = () => {
    let pool = retryPool ?? allQuestions
    if (!retryPool) {
      if (selectedCats.length > 0) pool = pool.filter(q => selectedCats.includes(q.category))
      if (!useAll) pool = pool.slice(0, limit || pool.length)
    }
    if (mode === 'shuffle' || mode === 'random') pool = shuffle(pool)
    setQuestions(pool); setAnswers({}); setRevealed({}); setCurrent(0); setSubmitted(false)
    armTimer()
    setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null); setRetrySelection(new Set())
    setRetryPool(null); setHasExported(false)
    if (!retryPool) { setPreviousResult(null); setShowPreviousResult(false) }
  }

  const exportSnapshot = (snap) => {
    const { content, now } = buildExportMarkdown(snap.questions, snap.answers, snap.scoreMode, snap.pointMode, snap.customPoints, snap.pct, snap.passed, snap.passPct, snap.sourceNames, snap.elapsedSeconds, snap.timerEnabled, snap.timerMinutes, snap.startedAt)
    const baseName = snap.sourceNames?.length === 1 ? slugifyFilename(snap.sourceNames[0]) : snap.sourceNames?.length > 1 ? 'nhieu-file' : 'quiz'
    downloadTextFile(`ket-qua_${baseName}_${formatTimestampForFilename(now)}.md`, content)
  }

  const exportCurrentResult = () => {
    const sourceNames = files.map(f => f.name)
    exportSnapshot({ questions, answers, scoreMode, pointMode, customPoints, pct, passed, passPct, sourceNames, elapsedSeconds, timerEnabled, timerMinutes, startedAt })
    setHasExported(true)
  }

  // Thực sự chuyển sang màn config làm lại: giữ kết quả hiện tại để có thể xem lại, rồi reset pool câu đã chọn
  // sourceSnapshot: truyền vào khi retry được bấm từ trang xem kết quả đã lưu/kết quả trước đó, để giữ đúng dữ liệu đang xem thay vì state chính (có thể đang rỗng)
  const proceedRetry = (subset, sourceSnapshot) => {
    const sourceNames = files.map(f => f.name)
    setPreviousResult(sourceSnapshot ?? buildResultSnapshot(questions, answers, scoreMode, pointMode, customPoints, pct, passed, passPct, sourceNames, elapsedSeconds, timerEnabled, timerMinutes, startedAt))
    setQuestions([]); setAnswers({}); setRevealed({}); setCurrent(0); setSubmitted(false)
    resetTimer()
    setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null); setRetrySelection(new Set())
    setRetryPool(subset)
    setHasExported(false)
    setImportedResult(null)
    setShowPreviousResult(false)
    requestAnimationFrame(() => {
      document.querySelector('#quiz-main-content')?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  // Chuẩn bị làm lại: hỏi xuất file trước nếu chưa xuất, nếu đã xuất rồi thì chuyển luôn
  // sourceSnapshot: khi gọi từ trang xem kết quả đã lưu/kết quả trước đó, giữ đúng dữ liệu đang xem cho previousResult
  const startRetry = (subset, sourceSnapshot) => {
    if (!subset.length) return
    if (!hasExported) {
      setPendingRetrySubset(subset)
      setPendingRetrySourceSnapshot(sourceSnapshot ?? null)
      return
    }
    proceedRetry(subset, sourceSnapshot)
  }

  const saveProgress = () => {
    const sourceNames = files.map(f => f.name)
    // nếu đang dừng, chốt khoảng dừng hiện tại vào tổng trước khi lưu
    const pausedMsAtSave = pausedMsAtNow()
    const { content, now } = buildProgressMarkdown({
      questions, answers, revealed, current,
      sourceNames, mode, useAll, limit,
      timerEnabled, timerMinutes, examMode, secondsLeft, timerStarted, timerPaused,
      revealMode, scoreMode, pointMode, customPoints, passPct, lockPrevious,
      startedAt, pausedMs: pausedMsAtSave,
    })
    const baseName = sourceNames.length === 1 ? slugifyFilename(sourceNames[0]) : sourceNames.length > 1 ? 'nhieu-file' : 'quiz'
    downloadTextFile(`dang-lam_${baseName}_${formatTimestampForFilename(now)}.md`, content)
  }

  // ── Tự động lưu session vào localStorage, debounce nhẹ để tránh ghi liên tục ──
  useEffect(() => {
    const t = setTimeout(() => {
      saveSession({
        allQuestions, files,
        selectedCats, mode, useAll, limit,
        timerEnabled, timerMinutes, examMode, timerStarted, timerPaused, secondsLeft,
        revealMode, scoreMode, pointMode, customPoints, passPct, lockPrevious,
        retryPool,
        questions, answers, revealed, current, submitted,
        startedAt, elapsedSeconds, pausedMs,
        pauseStartedAt: pauseStartedAt != null ? Date.now() : null,
      })
    }, 300)
    return () => clearTimeout(t)
  }, [
    allQuestions, files,
    selectedCats, mode, useAll, limit,
    timerEnabled, timerMinutes, examMode, timerStarted, timerPaused, secondsLeft,
    revealMode, scoreMode, pointMode, customPoints, passPct, lockPrevious,
    retryPool,
    questions, answers, revealed, current, submitted,
    startedAt, elapsedSeconds, pausedMs, pauseStartedAt,
  ])

  const q = questions[current]
  const isMulti = q?.type === 'multiple_choice'
  const sel = answers[current] ?? new Set()
  const answered = !!revealed[current]
  const locked = submitted || timeUp
  const showAnswer = canShowAnswer(effectiveRevealMode, answered, allDone)
  const isRevealed = showAnswer

  const toggleOption = (key) => toggleOptionAt(current, key, { timeUp })
  const confirm = () => confirmAt(current, { timeUp })
  const skip = () => skipAt(current, { timeUp })
  const getOptionStatus = (key) => getOptionStatusAt(current, key)

  const { totalCorrect, totalSkipped, maxPoint, earnedPoint, pct, passed } = computeScoring({
    questions, answers, scoreMode, pointMode, customPoints, passPct,
  })

  const poolSize = allQuestions.filter(q => selectedCats.length === 0 || selectedCats.includes(q.category)).length

  const needsStart = timerEnabled && questions.length > 0 && !timerStarted && !allDone

  if (importedResult) {
    return (
      <>
        <ResultsPage snapshot={importedResult} onClose={() => setImportedResult(null)} onRetry={subset => startRetry(subset, importedResult)} />
        {pendingRetrySubset && (
          <RetryExportConfirmModal
            onCancel={clearPendingRetry}
            onRetryWithoutExport={() => { proceedRetry(pendingRetrySubset, pendingRetrySourceSnapshot); clearPendingRetry() }}
            onExportThenRetry={() => { exportSnapshot(importedResult); proceedRetry(pendingRetrySubset, pendingRetrySourceSnapshot); clearPendingRetry() }}
          />
        )}
      </>
    )
  }

  if (showPreviousResult && previousResult) {
    return (
      <>
        <ResultsPage snapshot={previousResult} onClose={() => setShowPreviousResult(false)} onRetry={subset => startRetry(subset, previousResult)} />
        {pendingRetrySubset && (
          <RetryExportConfirmModal
            onCancel={clearPendingRetry}
            onRetryWithoutExport={() => { proceedRetry(pendingRetrySubset, pendingRetrySourceSnapshot); clearPendingRetry() }}
            onExportThenRetry={() => { exportSnapshot(previousResult); proceedRetry(pendingRetrySubset, pendingRetrySourceSnapshot); clearPendingRetry() }}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--spacing-header-h))]">

      {/* ══ MAIN: câu hỏi bên trái ══ */}
      <main
        id="quiz-main-content"
        className={`fixed top-header-h bottom-0 left-0 overflow-y-auto flex flex-col items-center px-3.5 md:px-8 pt-4 md:pt-10 pb-8 md:pb-20 transition-[right] duration-200 right-0 ${
          sidebarCollapsed ? '' : 'md:right-sidebar-w'
        }`}
      >
        {sidebarCollapsed && (
          <Button
            variant="outline"
            size="icon"
            className="fixed z-20 size-10 rounded-full shadow-md"
            style={{ top: 'calc(var(--spacing-header-h) + 16px)', right: 16 }}
            title="Mở lại thanh cài đặt"
            onClick={() => setSidebarCollapsed(false)}
          >⚙</Button>
        )}
        <div className="w-full max-w-[880px]">

        {timerEnabled && questions.length > 0 && timerStarted && !allDone && (
          <Card className={`flex-row items-center gap-2.5 px-4 py-2.5 mb-5 sticky top-4 z-10 ${
            secondsLeft <= 30 ? 'border-destructive' : ''
          } ${timerPaused ? 'opacity-70' : ''}`}>
            <span className="text-lg">⏱</span>
            <span className={`font-mono text-lg font-bold ${secondsLeft <= 30 ? 'text-destructive' : ''}`}>{formatTime(secondsLeft)}</span>
            {timerPaused && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">Đã dừng</Badge>
            )}
            <div className="ml-auto flex gap-2">
              {!examMode && (
                <Button variant="outline" size="sm" onClick={togglePause}>
                  {timerPaused ? '▶ Tiếp tục' : '⏸ Dừng'}
                </Button>
              )}
              {!examMode && (
                <Button variant="outline" size="sm" onClick={saveProgress}>💾 Lưu</Button>
              )}
              <Button variant="destructive" size="sm" onClick={requestSubmit}>Nộp bài</Button>
            </div>
          </Card>
        )}

        {questions.length > 0 && !needsStart && !allDone && (!timerEnabled || !timerStarted) && (
          <div className="mb-4.5">
            <Button variant="outline" size="sm" onClick={saveProgress}>💾 Lưu bài đang làm dở</Button>
          </div>
        )}

        {questions.length > 0 && !needsStart && !allDone && !lockPrevious && (
          <div className="flex gap-1 mb-4.5 bg-muted border rounded-lg p-1 w-full md:w-fit">
            <Button
              variant={viewMode === 'single' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 md:flex-none"
              onClick={() => setViewMode('single')}
            >Từng câu</Button>
            <Button
              variant={viewMode === 'scroll' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 md:flex-none"
              onClick={() => setViewMode('scroll')}
            >Scroll tất cả</Button>
          </div>
        )}

        {needsStart ? (
          <Card className="text-center py-12 px-4 md:py-20 md:px-5">
            <div className="text-4xl mb-3">⏱</div>
            <p className="text-base mb-1.5">
              Đề thi có giới hạn {timerMinutes} phút {examMode && '· Chế độ thi thật — không thể dừng giờ'}
            </p>
            <p className="text-sm text-muted-foreground mb-5">Nhấn Bắt đầu để tính giờ làm bài</p>
            <Button onClick={startTimer} className="mx-auto">▶ Bắt đầu làm bài</Button>
          </Card>
        ) : retryPool ? (
          <Card className="text-center py-12 px-4 md:py-20 md:px-5">
            <div className="text-4xl mb-3">🔁</div>
            <p className="text-base mb-1.5">Đã chọn {retryPool.length} câu để làm lại</p>
            <p className="text-sm text-muted-foreground">
              Chỉnh cấu hình (timer, cách chấm điểm, thi thật...) ở thanh bên phải rồi bấm "Bắt đầu làm lại"
            </p>
          </Card>
        ) : questions.length === 0 ? <EmptyState /> : allDone ? (
          <>
            {timeUp && (
              <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg px-3.5 py-2.5 text-sm mb-4">
                ⏰ Đã hết giờ — bài làm được tự động nộp
              </div>
            )}
            <ResultsContent
              questions={questions}
              answers={answers}
              reviewFilter={reviewFilter}
              onFilterChange={setReviewFilter}
              scoreMode={scoreMode}
              pointMode={pointMode}
              customPoints={customPoints}
              highlightIndex={highlightIndex}
              selectedSet={retrySelection}
              onToggleSelect={toggleRetrySelect}
              onSelectMany={selectManyRetry}
            />
          </>
        ) : viewMode === 'scroll' && !lockPrevious ? (
          <ScrollView
            questions={questions}
            answers={answers}
            revealed={revealed}
            revealMode={effectiveRevealMode}
            allDone={allDone}
            locked={locked}
            scoreMode={scoreMode}
            pointMode={pointMode}
            customPoints={customPoints}
            toggleOptionAt={toggleOptionAt}
            getOptionStatusAt={getOptionStatusAt}
            confirmAt={confirmAt}
            skipAt={skipAt}
            onSubmit={requestSubmit}
          />
        ) : (
          <QuestionView
            q={q}
            current={current}
            questions={questions}
            isMulti={isMulti}
            sel={sel}
            answered={answered}
            locked={locked}
            allDone={allDone}
            lockPrevious={lockPrevious}
            timeUp={timeUp}
            scoreMode={scoreMode}
            pointMode={pointMode}
            customPoints={customPoints}
            getOptionStatus={getOptionStatus}
            toggleOption={toggleOption}
            isRevealed={isRevealed}
            onPrev={() => setCurrent(c => Math.max(0, c - 1))}
            onNext={() => setCurrent(c => c + 1)}
            onStepForward={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
            onSkip={skip}
            onConfirm={confirm}
            onSubmit={requestSubmit}
          />
        )}
        </div>
      </main>

      {/* ══ SIDEBAR: config bên phải ══ */}
      {!sidebarCollapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      <aside
        className={`w-[min(86vw,360px)] max-w-[360px] md:w-sidebar-w md:max-w-none shrink-0 bg-card border-l flex flex-col fixed top-header-h right-0 bottom-0 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-8 transition-transform duration-200 shadow-[-8px_0_24px_rgba(0,0,0,0.35)] md:shadow-none z-[60] md:z-auto ${
          sidebarCollapsed ? 'translate-x-full pointer-events-none' : 'translate-x-0'
        }`}
      >

        <div className="flex items-center gap-2 pb-4 border-b">
          <div className="text-sm font-bold flex-1">Cấu hình</div>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-full"
            title="Thu nhỏ thanh cài đặt"
            onClick={() => setSidebarCollapsed(true)}
          >»</Button>
        </div>

        <div className="flex flex-col gap-3 py-5">
          {/* Upload */}
          <div
            className={`block w-full text-center py-3 px-3 rounded-lg border-[1.5px] border-dashed text-sm text-muted-foreground cursor-pointer transition-colors ${
              dragOver ? 'border-primary text-foreground' : ''
            }`}
            onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); loadFiles(e.dataTransfer.files) }}
          >
            + Thêm file .md
            <input ref={fileRef} type="file" accept=".md" multiple className="hidden"
              onChange={e => loadFiles(e.target.files)} />
          </div>
          <Button variant="outline" className="w-full" onClick={() => importResultRef.current.click()}>
            📂 Mở lại kết quả đã lưu
            <input ref={importResultRef} type="file" accept=".md" className="hidden"
              onChange={e => { loadResultFile(e.target.files); e.target.value = '' }} />
          </Button>
          <Button variant="outline" className="w-full" onClick={() => importProgressRef.current.click()}>
            📥 Mở bài đang làm dở
            <input ref={importProgressRef} type="file" accept=".md" className="hidden"
              onChange={e => { loadProgressFile(e.target.files); e.target.value = '' }} />
          </Button>
          <div className="text-xs text-muted-foreground text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => setShowHelp(true)}>
            ℹ️ Xem hướng dẫn định dạng file .md
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="flex flex-col gap-1 pb-5">
            {files.map(f => (
              <div key={f.name} className="flex items-center justify-between py-1.5 text-[0.78rem] gap-2">
                <span className="text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap flex-1" title={f.name}>{f.name}</span>
                <span className="text-muted-foreground shrink-0">{f.count} câu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 size-5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Xoá file này"
                  onClick={() => removeFile(f.name)}
                >✕</Button>
              </div>
            ))}
            <div className="text-[0.76rem] text-muted-foreground py-2 border-t mt-1">
              Tổng cộng: <strong>{allQuestions.length} câu</strong>
            </div>
            <Button
              variant="outline"
              className="w-full h-9 text-muted-foreground hover:text-destructive hover:border-destructive"
              onClick={clearAll}
            >Xoá tất cả</Button>
          </div>
        )}

        {/* Config */}
        {(allQuestions.length > 0 || retryPool) && (
          <QuizSetupSidebar
            categories={categories}
            selectedCats={selectedCats}
            toggleCat={toggleCat}
            mode={mode}
            setMode={setMode}
            useAll={useAll}
            setUseAll={setUseAll}
            limit={limit}
            setLimit={setLimit}
            poolSize={poolSize}
            timerEnabled={timerEnabled}
            setTimerEnabled={setTimerEnabled}
            timerMinutes={timerMinutes}
            setTimerMinutes={setTimerMinutes}
            examMode={examMode}
            setExamMode={setExamMode}
            revealMode={revealMode}
            setRevealMode={setRevealMode}
            lockPrevious={lockPrevious}
            setLockPrevious={setLockPrevious}
            scoreMode={scoreMode}
            setScoreMode={setScoreMode}
            pointMode={pointMode}
            setPointMode={setPointMode}
            customPoints={customPoints}
            setCustomPoints={setCustomPoints}
            passPct={passPct}
            setPassPct={setPassPct}
            retryPool={retryPool}
            previousResult={previousResult}
            onShowPreviousResult={() => setShowPreviousResult(true)}
            onCancelRetryPool={() => setRetryPool(null)}
            onBuildQuiz={buildQuiz}
            hasQuestions={questions.length > 0}
          />
        )}

        {/* Nav dots */}
        {questions.length > 0 && (
          <div className="flex flex-col gap-2 border-t pt-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Câu hỏi {allDone && <span className={`font-bold ${passed ? 'text-success' : 'text-destructive'}`}>{pct}%</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((_, i) => {
                const ans = answers[i] ?? new Set()
                const wasAnswered = !!revealed[i]
                const canShowResult = canShowNavDotResult(effectiveRevealMode, wasAnswered, allDone)
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
                    className={navDotClass({ isActive, ok, bad, pending, navLocked })}
                    onClick={() => { if (navLocked) return; allDone ? goToReviewQuestion(i) : (setCurrent(i), window.scrollTo(0, 0)) }}
                  >{i + 1}</div>
                )
              })}
            </div>
          </div>
        )}

        {/* Kết quả tổng khi xong */}
        {allDone && (
          <ResultSidebarSummary
            pct={pct}
            passed={passed}
            passPct={passPct}
            scoreMode={scoreMode}
            earnedPoint={earnedPoint}
            maxPoint={maxPoint}
            totalCorrect={totalCorrect}
            totalWrong={questions.length - totalCorrect - totalSkipped}
            totalSkipped={totalSkipped}
            elapsedSeconds={elapsedSeconds}
            timerEnabled={timerEnabled}
            timerMinutes={timerMinutes}
            startedAt={startedAt}
            retrySelectionSize={retrySelection.size}
            onRetrySelected={() => startRetry(questions.filter((_, i) => retrySelection.has(i)))}
          >
            <Button variant="outline" className="w-full" onClick={exportCurrentResult}>📥 Xuất kết quả (.md)</Button>
          </ResultSidebarSummary>
        )}

      </aside>

      {confirmSubmit && (
        <ConfirmSubmitModal
          unansweredCount={questions.filter((_, i) => !revealed[i]).length}
          onConfirm={confirmAndSubmit}
          onCancel={cancelSubmit}
        />
      )}
      {pendingRetrySubset && (
        <RetryExportConfirmModal
          onCancel={clearPendingRetry}
          onRetryWithoutExport={() => { proceedRetry(pendingRetrySubset, pendingRetrySourceSnapshot); clearPendingRetry() }}
          onExportThenRetry={() => { exportCurrentResult(); proceedRetry(pendingRetrySubset, pendingRetrySourceSnapshot); clearPendingRetry() }}
        />
      )}
      {showHelp && <QuizHelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
