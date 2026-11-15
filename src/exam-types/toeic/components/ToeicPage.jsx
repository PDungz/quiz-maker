import { useRef, useState, useEffect } from 'react'
import { parseMarkdownWithPassages } from '../../../parser'
import { useFileLibrary } from '../../../features/file-library'
import { useAudioLibrary } from '../../../features/audio-library'
import { useQuizSession, useTimer, canShowNavDotResult } from '../../../features/quiz-session'
import { useRetrySelection, computeScoring, ResultsPage, ResultsContent, ResultSidebarSummary } from '../../../features/results'
import { formatTime } from '../../../utils/quiz'
import { buildExportMarkdown, parseExportSnapshot, downloadTextFile, slugifyFilename, formatTimestampForFilename } from '../../../utils/export'
import { saveSession, loadSession, clearSession } from '../../../utils/persist'
import { buildToeicProgressMarkdown, parseToeicProgressSnapshot } from '../utils/toeicExport'
import { getToeicSessionConfig } from '../utils/toeicSessionConfig'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import EmptyState from '@/components/EmptyState'
import PassageQuestionGroup from './PassageQuestionGroup'
import ToeicSetupSidebar from './ToeicSetupSidebar'
import ToeicHelpModal from './ToeicHelpModal'
import { useToeicConfig } from '../hooks/useToeicConfig'

const SESSION_KEY = 'toeic-maker-session'
// Đọc session đã lưu một lần duy nhất lúc module load, dùng làm giá trị khởi tạo cho các hook bên dưới
const saved = loadSession(SESSION_KEY) ?? {}

// Trang làm bài TOEIC Reading (Part 5-7): nạp file .md → chọn Luyện tập/Thi thử + chọn Part
// → làm bài, điều hướng theo tab Part (mỗi Part cuộn list riêng, Part 6-7 luôn hiện cả đoạn
// văn + toàn bộ câu hỏi liên quan cùng lúc, không tách lẻ từng câu) → nộp → xem kết quả.
// Tái dùng nguyên các luồng chung: file-library, quiz-session, timer, results.
export default function ToeicPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 640)
  // Part đang xem trong lúc làm bài — khác với selectedParts (các Part được CHỌN để đưa vào đề lúc bắt đầu)
  const [activePart, setActivePart] = useState(() => saved.activePart ?? null)
  const { allQuestions, setAllQuestions, allPassages, loadFiles, files, setFiles, removeFile, clearAll: clearFileLibrary } = useFileLibrary(saved, { parseFn: parseMarkdownWithPassages })
  // Audio/ảnh cho Listening (Part 1-4) — sống riêng trong phiên làm việc, KHÔNG lưu vào session/
  // export vì object URL (blob:) chết khi reload trang, không thể phục hồi được qua localStorage.
  const { audioByNumber, imageByNumber, audioFolderName, loadAudioFolder, clearAudioLibrary } = useAudioLibrary()
  const fileRef = useRef()
  const audioFolderRef = useRef()
  const importResultRef = useRef()
  const importProgressRef = useRef()
  const [dragOver, setDragOver] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [reviewFilter, setReviewFilter] = useState('all')
  const [highlightIndex, setHighlightIndex] = useState(null)
  const [selectedDotIndex, setSelectedDotIndex] = useState(null)
  const [importedResult, setImportedResult] = useState(null)
  const { retrySelection, toggleRetrySelect, selectManyRetry, setRetrySelection } = useRetrySelection()

  const config = useToeicConfig(saved)
  const {
    examStyle, setExamStyle, selectedParts, setSelectedParts, togglePart,
    timerMinutes, setTimerMinutes, splitByPart, setSplitByPart,
    practiceTimerEnabled, setPracticeTimerEnabled,
  } = config

  // Toàn bộ cấu hình của 1 lượt làm bài (examMode/revealMode/lockPrevious/timerEnabled) suy ra
  // từ examStyle + practiceTimerEnabled — xem utils/toeicSessionConfig.js, không rải điều kiện ở đây.
  const { examMode, revealMode, lockPrevious, timerEnabled, autoSubmitOnTimeUp } = getToeicSessionConfig(examStyle, practiceTimerEnabled)

  const session = useQuizSession({ saved, revealMode, examMode, lockPrevious, viewMode: 'scroll' })
  const {
    questions, setQuestions, answers, setAnswers, revealed, setRevealed, submitted, setSubmitted,
    allDone, effectiveRevealMode, toggleOptionAt, confirmAt, skipAt, getOptionStatusAt, resetSession, finalizeSubmit: finalizeSessionSubmit,
  } = session

  const finalizeSubmit = () => {
    finalizeSessionSubmit()
    timer.finalizeElapsed()
  }

  // Luyện tập có bật timer tham khảo: hết giờ chỉ dừng đếm (timeUp=true để hiện cảnh báo),
  // không tự nộp bài — khác với Thi thử luôn tự nộp khi hết giờ.
  const timer = useTimer({ saved, timerEnabled, timerMinutes, submitted, onTimeUp: autoSubmitOnTimeUp ? finalizeSubmit : () => {} })
  const { timerStarted, timerPaused, secondsLeft, timeUp, elapsedSeconds, startedAt, startTimer, resetTimer, armTimer } = timer

  // Đếm số câu theo từng Part có trong toàn bộ câu đã nạp, dùng cho sidebar chọn Part
  const partCounts = {}
  allQuestions.forEach(q => { if (q.part) partCounts[q.part] = (partCounts[q.part] ?? 0) + 1 })

  const poolSize = allQuestions.filter(q => selectedParts.length === 0 || selectedParts.includes(q.part)).length

  // Các Part thực sự có mặt trong đề đang làm (questions), theo đúng thứ tự tăng dần — dùng để
  // render tab Part và chọn activePart mặc định.
  const partsInQuestions = [...new Set(questions.map(q => q.part).filter(Boolean))].sort((a, b) => a - b)
  // activePart có thể lệch với đề hiện tại (phục hồi từ session cũ, hoặc Part đó đã bị bỏ chọn
  // khi gen lại đề) — khi đó rơi về Part đầu tiên thực sự có, để không bao giờ lọc ra danh sách
  // rỗng một cách âm thầm.
  const effectiveActivePart = partsInQuestions.includes(activePart) ? activePart : (partsInQuestions[0] ?? null)

  const buildQuiz = () => {
    const pool = allQuestions.filter(q => selectedParts.length === 0 || selectedParts.includes(q.part))
    setQuestions(pool); setAnswers({}); setRevealed({}); setSubmitted(false)
    armTimer()
    setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null); setRetrySelection(new Set())
    const firstPart = [...new Set(pool.map(q => q.part).filter(Boolean))].sort((a, b) => a - b)[0] ?? null
    setActivePart(firstPart)
  }

  const resetToeic = () => {
    resetSession()
    resetTimer()
    setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null); setRetrySelection(new Set()); setActivePart(null)
  }

  const clearAll = () => {
    clearFileLibrary()
    clearAudioLibrary()
    resetToeic()
    setSelectedParts([])
    clearSession(SESSION_KEY)
  }

  const loadResultFile = (fileList) => {
    const file = fileList?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      const snapshot = parseExportSnapshot(e.target.result)
      if (!snapshot) {
        alert('File này không phải kết quả TOEIC hợp lệ do Quiz Maker xuất ra.')
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
      const snap = parseToeicProgressSnapshot(e.target.result)
      if (!snap) {
        alert('File này không phải bài TOEIC đang làm dở hợp lệ do Quiz Maker xuất ra.')
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
      setSubmitted(false)
      setExamStyle(snap.examStyle ?? 'practice')
      setSelectedParts(snap.selectedParts ?? [])
      setTimerMinutes(snap.timerMinutes ?? 75)
      setPracticeTimerEnabled(!!snap.practiceTimerEnabled)
      timer.setSecondsLeft(snap.secondsLeft ?? 0)
      timer.setTimerStarted(!!snap.timerStarted)
      timer.setTimerPaused(!!snap.timerPaused)
      timer.setTimeUp(false)
      timer.setStartedAt(snap.startedAt ?? null)
      timer.setElapsedSeconds(null)
      timer.setPausedMs(snap.pausedMs ?? 0)
      timer.setPauseStartedAt(snap.timerPaused ? Date.now() : null)
      setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null); setRetrySelection(new Set())
      const firstPart = [...new Set(snap.questions.map(q => q.part).filter(Boolean))].sort((a, b) => a - b)[0] ?? null
      setActivePart(firstPart)
    }
    reader.readAsText(file)
  }

  const exportSnapshot = (snap) => {
    const { content, now } = buildExportMarkdown(snap.questions, snap.answers, snap.scoreMode, snap.pointMode, snap.customPoints, snap.pct, snap.passed, snap.passPct, snap.sourceNames, snap.elapsedSeconds, snap.timerEnabled, snap.timerMinutes, snap.startedAt)
    const baseName = snap.sourceNames?.length === 1 ? slugifyFilename(snap.sourceNames[0]) : snap.sourceNames?.length > 1 ? 'nhieu-file' : 'toeic'
    downloadTextFile(`ket-qua-toeic_${baseName}_${formatTimestampForFilename(now)}.md`, content)
  }

  const exportCurrentResult = () => {
    const sourceNames = files.map(f => f.name)
    exportSnapshot({ questions, answers, scoreMode: 'count', pointMode: 'fixed', customPoints: {}, pct, passed, passPct: 70, sourceNames, elapsedSeconds, timerEnabled, timerMinutes, startedAt })
  }

  const saveProgress = () => {
    const sourceNames = files.map(f => f.name)
    const pausedMsAtSave = timer.pausedMsAtNow()
    const { content, now } = buildToeicProgressMarkdown({
      questions, answers, revealed,
      sourceNames, examStyle, selectedParts, timerMinutes, practiceTimerEnabled,
      secondsLeft, timerStarted, timerPaused,
      startedAt, pausedMs: pausedMsAtSave,
    })
    const baseName = sourceNames.length === 1 ? slugifyFilename(sourceNames[0]) : sourceNames.length > 1 ? 'nhieu-file' : 'toeic'
    downloadTextFile(`toeic-dang-lam_${baseName}_${formatTimestampForFilename(now)}.md`, content)
  }

  // ── Tự động lưu session vào localStorage (key riêng cho TOEIC), debounce nhẹ ──
  useEffect(() => {
    const t = setTimeout(() => {
      saveSession({
        allQuestions, files,
        examStyle, selectedParts, timerMinutes, activePart, splitByPart, practiceTimerEnabled,
        timerStarted, timerPaused, secondsLeft,
        questions, answers, revealed, submitted,
        startedAt, elapsedSeconds, pausedMs: timer.pausedMs,
        pauseStartedAt: timer.pauseStartedAt != null ? Date.now() : null,
      }, SESSION_KEY)
    }, 300)
    return () => clearTimeout(t)
  }, [
    allQuestions, files,
    examStyle, selectedParts, timerMinutes, activePart, splitByPart, practiceTimerEnabled,
    timerStarted, timerPaused, secondsLeft,
    questions, answers, revealed, submitted,
    startedAt, elapsedSeconds, timer.pausedMs, timer.pauseStartedAt,
  ])

  const needsStart = timerEnabled && questions.length > 0 && !timerStarted && !allDone
  // Thi thử: hết giờ khoá bài luôn (tự nộp). Luyện tập: hết giờ chỉ cảnh báo, vẫn làm tiếp được.
  const locked = submitted || (timeUp && autoSubmitOnTimeUp)

  const { totalCorrect, totalSkipped, maxPoint, earnedPoint, pct, passed } = questions.length
    ? computeScoring({ questions, answers, scoreMode: 'count', pointMode: 'fixed', customPoints: {}, passPct: 70 })
    : { totalCorrect: 0, totalSkipped: 0, maxPoint: 0, earnedPoint: 0, pct: 0, passed: false }

  // Gom câu hỏi theo đoạn văn (giữ nguyên thứ tự xuất hiện); câu không có passage_id đứng riêng
  // từng nhóm 1 câu (Part 5). Part 6-7: 1 đoạn văn + toàn bộ câu liên quan luôn hiển thị cùng 1
  // khối, không tách lẻ. splitByPart quyết định chỉ lấy câu của Part đang xem, hay lấy hết.
  const passageById = Object.fromEntries(allPassages.map(p => [p.id, p]))
  const questionsInActivePart = splitByPart ? questions.filter(q => q.part === effectiveActivePart) : questions
  const groups = []
  const passageGroupIndex = new Map()
  questionsInActivePart.forEach((q) => {
    if (!q.passageId) {
      groups.push({ passage: null, questions: [q], part: q.part })
      return
    }
    if (passageGroupIndex.has(q.passageId)) {
      groups[passageGroupIndex.get(q.passageId)].questions.push(q)
    } else {
      passageGroupIndex.set(q.passageId, groups.length)
      groups.push({ passage: passageById[q.passageId], questions: [q], part: q.part })
    }
  })
  // Khi không chia theo tab Part (splitByPart = false), chèn tiêu đề "Part X" ngay trước group
  // đầu tiên của mỗi Part mới, để biết đang cuộn tới Part nào — không áp dụng khi đã có tab Part.
  let lastPartHeading = null

  const questionIndexOf = (q) => questions.indexOf(q)
  const getAudioUrl = (q) => q?.number != null ? audioByNumber[q.number] : undefined
  const getImageUrl = (q) => q?.number != null ? imageByNumber[q.number] : undefined

  const goToReviewQuestion = (i) => {
    setHighlightIndex(i)
    setSelectedDotIndex(i)
    requestAnimationFrame(() => {
      document.getElementById(`review-q-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    setTimeout(() => setHighlightIndex(cur => cur === i ? null : cur), 2000)
  }

  // Làm lại subset câu hỏi đang xem từ 1 kết quả đã lưu (import từ file .md)
  const startRetryFromImported = (subset) => {
    if (!subset.length) return
    setImportedResult(null)
    setQuestions(subset); setAnswers({}); setRevealed({}); setSubmitted(false)
    armTimer()
    setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null); setRetrySelection(new Set())
    const firstPart = [...new Set(subset.map(q => q.part).filter(Boolean))].sort((a, b) => a - b)[0] ?? null
    setActivePart(firstPart)
  }

  if (importedResult) {
    return <ResultsPage snapshot={importedResult} onClose={() => setImportedResult(null)} onRetry={startRetryFromImported} />
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--spacing-header-h))]">

      {/* ══ MAIN: câu hỏi bên trái ══ */}
      <main
        id="toeic-main-content"
        className={`fixed top-header-h bottom-0 left-0 flex flex-col transition-[right] duration-200 right-0 ${
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

        {/* Khu vực tab Part / đếm giờ / lưu bài / nộp bài — đứng yên, không cuộn theo câu hỏi */}
        {questions.length > 0 && !needsStart && !allDone && (
          <div className="shrink-0 px-3.5 md:px-8 pt-4 md:pt-6 flex justify-center">
            <div className="w-full max-w-[880px] flex flex-col gap-3">
              {splitByPart && partsInQuestions.length > 1 && (
                <div className="flex gap-1 bg-muted border rounded-lg w-full md:w-fit">
                  {partsInQuestions.map(part => (
                    <Button
                      key={part}
                      variant={effectiveActivePart === part ? 'default' : 'secondary'}
                      size="sm"
                      className="flex-1 md:flex-none md:w-24"
                      onClick={() => setActivePart(part)}
                    >Part {part}</Button>
                  ))}
                </div>
              )}

              {timerEnabled && timerStarted ? (
                <Card className={`flex-row items-center gap-2.5 px-4 py-2.5 ${
                  secondsLeft <= 30 ? 'border-destructive' : ''
                } ${timerPaused ? 'opacity-70' : ''}`}>
                  <span className="text-lg">⏱</span>
                  <span className={`font-mono text-lg font-bold ${secondsLeft <= 30 ? 'text-destructive' : ''}`}>{formatTime(secondsLeft)}</span>
                  <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={saveProgress}>💾 Lưu</Button>
                    <Button variant="destructive" size="sm" onClick={finalizeSubmit}>Nộp bài</Button>
                  </div>
                </Card>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={saveProgress}>💾 Lưu bài đang làm dở</Button>
                  <Button variant="destructive" size="sm" className="ml-auto" onClick={finalizeSubmit} disabled={!questions.every((_, i) => revealed[i])}>
                    Nộp bài 🏁
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vùng câu hỏi — cuộn riêng, tách khỏi khu vực tab Part/đếm giờ/nộp bài phía trên */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center px-3.5 md:px-8 pt-4 md:pt-6 pb-8 md:pb-20">
        <div className="w-full max-w-[880px]">

          {needsStart ? (
            <Card className="text-center py-12 px-4 md:py-20 md:px-5">
              <div className="text-4xl mb-3">⏱</div>
              <p className="text-base mb-1.5">
                Đồng hồ đếm {timerMinutes} phút{autoSubmitOnTimeUp ? ' · Chế độ thi thử — hết giờ tự nộp bài' : ' · Chỉ để tham khảo, hết giờ vẫn làm tiếp được'}
              </p>
              <p className="text-sm text-muted-foreground mb-5">Nhấn Bắt đầu để tính giờ làm bài</p>
              <Button onClick={startTimer} className="mx-auto">▶ Bắt đầu làm bài</Button>
            </Card>
          ) : questions.length === 0 ? (
            <EmptyState />
          ) : allDone ? (
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
                scoreMode="count"
                pointMode="fixed"
                customPoints={{}}
                highlightIndex={highlightIndex}
                selectedSet={retrySelection}
                onToggleSelect={toggleRetrySelect}
                onSelectMany={selectManyRetry}
              />
            </>
          ) : (
            <>
              {timeUp && !autoSubmitOnTimeUp && (
                <div className="bg-muted border border-border rounded-lg px-3.5 py-2.5 text-sm mb-4">
                  ⏰ Đã hết thời gian tham khảo — bạn vẫn có thể tiếp tục làm bài
                </div>
              )}
              {groups.map((g, gi) => {
                const showPartHeading = !splitByPart && g.part !== lastPartHeading
                if (showPartHeading) lastPartHeading = g.part
                return (
                  <PassageQuestionGroup
                    key={g.passage ? g.passage.id : `standalone-${gi}`}
                    passage={g.passage}
                    questions={g.questions}
                    questionIndexOf={questionIndexOf}
                    answers={answers}
                    revealed={revealed}
                    locked={locked}
                    partHeading={showPartHeading ? g.part : null}
                    getAudioUrl={getAudioUrl}
                    getImageUrl={getImageUrl}
                    getOptionStatusAt={getOptionStatusAt}
                    toggleOptionAt={(i, key) => toggleOptionAt(i, key, { timeUp })}
                    confirmAt={(i) => confirmAt(i, { timeUp })}
                    skipAt={(i) => skipAt(i, { timeUp })}
                  />
                )
              })}
            </>
          )}
        </div>
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
          <div className="text-sm font-bold flex-1">Cấu hình TOEIC</div>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-full"
            title="Thu nhỏ thanh cài đặt"
            onClick={() => setSidebarCollapsed(true)}
          >»</Button>
        </div>

        <div className="flex flex-col gap-3 py-5">
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
          <Button variant="outline" className="w-full" onClick={() => audioFolderRef.current.click()}>
            🎧 Thêm folder audio (Listening)
            <input ref={audioFolderRef} type="file" webkitdirectory="" multiple className="hidden"
              onChange={e => { loadAudioFolder(e.target.files); e.target.value = '' }} />
          </Button>
          {audioFolderName && (
            <div className="text-[0.76rem] text-muted-foreground -mt-1">
              Đã nạp audio/ảnh từ: <strong>{audioFolderName}</strong>
            </div>
          )}
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
              Tổng cộng: <strong>{allQuestions.length} câu</strong>, {allPassages.length} đoạn văn
            </div>
            <Button
              variant="outline"
              className="w-full h-9 text-muted-foreground hover:text-destructive hover:border-destructive"
              onClick={clearAll}
            >Xoá tất cả</Button>
          </div>
        )}

        {allQuestions.length > 0 && (
          <ToeicSetupSidebar
            partCounts={partCounts}
            selectedParts={selectedParts}
            togglePart={togglePart}
            setSelectedParts={setSelectedParts}
            examStyle={examStyle}
            setExamStyle={setExamStyle}
            splitByPart={splitByPart}
            setSplitByPart={setSplitByPart}
            timerMinutes={timerMinutes}
            setTimerMinutes={setTimerMinutes}
            practiceTimerEnabled={practiceTimerEnabled}
            setPracticeTimerEnabled={setPracticeTimerEnabled}
            poolSize={poolSize}
            onBuildQuiz={buildQuiz}
            hasQuestions={questions.length > 0}
          />
        )}

        {questions.length > 0 && (
          <div className="flex flex-col gap-2 border-t pt-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Câu hỏi{splitByPart && effectiveActivePart && !allDone ? ` — Part ${effectiveActivePart}` : ''} {allDone && <span className={`font-bold ${passed ? 'text-success' : 'text-destructive'}`}>{pct}%</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, i) => {
                if (splitByPart && !allDone && q.part !== effectiveActivePart) return null
                const ans = answers[i] ?? new Set()
                const wasAnswered = !!revealed[i]
                const canShowResult = canShowNavDotResult(effectiveRevealMode, wasAnswered, allDone)
                const ck = new Set(questions[i].correct_answer)
                const isSkipped = !ans.size
                const ok = canShowResult && !isSkipped && ans.size === ck.size && [...ans].every(k => ck.has(k))
                const bad = canShowResult && !isSkipped && !ok
                if (allDone && reviewFilter !== 'all') {
                  const status = isSkipped ? 'skipped' : ok ? 'correct' : 'wrong'
                  if (status !== reviewFilter) return null
                }
                const isActive = allDone && i === selectedDotIndex
                return (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold border transition-colors cursor-pointer ${
                      ok ? 'bg-success text-success-foreground border-success' :
                      bad ? 'bg-destructive text-white border-destructive' :
                      'bg-muted text-muted-foreground border-border hover:text-foreground hover:border-ring'
                    } ${isActive ? 'outline outline-2 outline-ring outline-offset-1' : ''}`}
                    onClick={() => { if (allDone) goToReviewQuestion(i) }}
                  >{i + 1}</div>
                )
              })}
            </div>
          </div>
        )}

        {allDone && (
          <ResultSidebarSummary
            pct={pct}
            passed={passed}
            passPct={70}
            scoreMode="count"
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
            onRetrySelected={() => {
              const subset = questions.filter((_, i) => retrySelection.has(i))
              if (!subset.length) return
              setQuestions(subset); setAnswers({}); setRevealed({}); setSubmitted(false)
              armTimer()
              setReviewFilter('all'); setHighlightIndex(null); setSelectedDotIndex(null); setRetrySelection(new Set())
              const firstPart = [...new Set(subset.map(q => q.part).filter(Boolean))].sort((a, b) => a - b)[0] ?? null
              setActivePart(firstPart)
            }}
          >
            <Button variant="outline" className="w-full" onClick={exportCurrentResult}>📥 Xuất kết quả (.md)</Button>
            <Button variant="outline" className="w-full" onClick={resetToeic}>↺ Làm bài khác</Button>
          </ResultSidebarSummary>
        )}
      </aside>
      {showHelp && <ToeicHelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
