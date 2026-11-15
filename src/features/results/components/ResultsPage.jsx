import { useState } from 'react'
import { isCorrect, formatDuration } from '../../../utils/quiz'
import { computeScoring } from '../utils/scoring'
import { useRetrySelection } from '../hooks/useRetrySelection'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ResultsContent from './ResultsContent'
import ResultSidebarSummary from './ResultSidebarSummary'

const navDotClass = ({ isActive, ok, isSkipped }) => {
  let c = 'w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold border transition-colors cursor-pointer '
  if (ok) c += 'bg-success text-success-foreground border-success'
  else if (isSkipped) c += 'border-ring text-foreground bg-muted'
  else c += 'bg-destructive text-white border-destructive'
  if (isActive) c += ' outline outline-2 outline-ring outline-offset-1'
  return c
}

// Trang độc lập hiển thị 1 kết quả đã lưu (file .md import) hoặc kết quả trước đó (trước khi bấm Làm lại).
// Dùng chung ResultsContent/ResultSidebarSummary với màn "vừa nộp bài" trong App.jsx.
export default function ResultsPage({ snapshot, onClose, onRetry }) {
  const [filter, setFilter] = useState('all')
  const [highlightIndex, setHighlightIndex] = useState(null)
  const [selectedDotIndex, setSelectedDotIndex] = useState(null)
  const { retrySelection, toggleRetrySelect, selectManyRetry } = useRetrySelection()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 640)
  const { questions, answers, scoreMode, pointMode, customPoints, pct, passed, passPct, sourceNames, savedAt, elapsedSeconds, timerEnabled, timerMinutes, startedAt } = snapshot

  const { totalCorrect, totalSkipped, maxPoint, earnedPoint } = computeScoring({
    questions, answers, scoreMode, pointMode, customPoints, passPct,
  })

  const goToQuestion = (i) => {
    setHighlightIndex(i)
    setSelectedDotIndex(i)
    requestAnimationFrame(() => {
      document.getElementById(`review-q-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    setTimeout(() => setHighlightIndex(cur => cur === i ? null : cur), 2000)
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--spacing-header-h))]">
      <main
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
          <Card className="mb-4">
            <CardContent className="text-sm text-muted-foreground flex flex-col gap-1">
              <h3 className="text-foreground font-semibold mb-1">📂 Kết quả đã lưu</h3>
              {sourceNames?.length > 0 && <div>File nguồn: <strong>{sourceNames.join(', ')}</strong></div>}
              <div>Làm lúc: <strong>{new Date(savedAt).toLocaleString('vi-VN')}</strong></div>
              <div>
                Điểm: <strong className={passed ? 'text-success' : 'text-destructive'}>{pct}%</strong>
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
            </CardContent>
          </Card>

          <ResultsContent
            questions={questions}
            answers={answers}
            reviewFilter={filter}
            onFilterChange={setFilter}
            scoreMode={scoreMode}
            pointMode={pointMode}
            customPoints={customPoints}
            highlightIndex={highlightIndex}
            selectedSet={retrySelection}
            onToggleSelect={toggleRetrySelect}
            onSelectMany={selectManyRetry}
          />
        </div>
      </main>

      {!sidebarCollapsed && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setSidebarCollapsed(true)} />
      )}
      <aside
        className={`w-[min(86vw,360px)] max-w-[360px] md:w-sidebar-w md:max-w-none shrink-0 bg-card border-l flex flex-col fixed top-header-h right-0 bottom-0 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-8 transition-transform duration-200 shadow-[-8px_0_24px_rgba(0,0,0,0.35)] md:shadow-none z-[60] md:z-auto ${
          sidebarCollapsed ? 'translate-x-full pointer-events-none' : 'translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 pb-4 border-b">
          <div className="w-8 h-8 rounded-lg bg-muted border flex items-center justify-center text-base shrink-0">📝</div>
          <div className="text-sm font-bold flex-1">Quiz</div>
          <Button variant="outline" size="icon" className="size-7 rounded-full" title="Thu nhỏ thanh cài đặt" onClick={() => setSidebarCollapsed(true)}>»</Button>
          <Button variant="outline" size="icon" className="size-7 rounded-full" title="Đóng kết quả đã lưu" onClick={onClose}>✕</Button>
        </div>

        <div className="flex flex-col gap-2 border-t pt-5 mt-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Câu hỏi <span className={`font-bold ${passed ? 'text-success' : 'text-destructive'}`}>{pct}%</span>
          </div>
          <div className="flex flex-wrap gap-2">
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
                  className={navDotClass({ isActive: i === selectedDotIndex, ok, isSkipped })}
                  onClick={() => goToQuestion(i)}
                >{i + 1}</div>
              )
            })}
          </div>
        </div>

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
          onRetrySelected={() => onRetry(questions.filter((_, i) => retrySelection.has(i)))}
        />
      </aside>
    </div>
  )
}
