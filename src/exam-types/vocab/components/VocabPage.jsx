import { useRef, useState, useEffect } from 'react'
import { useVocabLibrary } from '../hooks/useVocabLibrary'
import { useSrsProgress, QUALITY } from '../../../features/srs'
import { buildVocabResultMarkdown } from '../vocabExport'
import { downloadTextFile, formatTimestampForFilename, slugifyFilename } from '../../../utils/export'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import EmptyState from '@/components/EmptyState'
import FlashcardView from './FlashcardView'
import TypingCardView from './TypingCardView'
import CardRelatedInfo from './CardRelatedInfo'
import VocabHelpModal from './VocabHelpModal'

const REVIEW_QUALITY = {
  forgot: QUALITY.FORGOT,
  hard: QUALITY.HARD,
  good: QUALITY.GOOD,
  easy: QUALITY.EASY,
}

const QUALITY_LABEL = { forgot: 'Quên', hard: 'Khó', good: 'Bình thường', easy: 'Dễ' }
const QUALITY_BADGE_VARIANT = { forgot: 'destructive', hard: 'outline', good: 'secondary', easy: 'default' }

// Dùng chung cho cả prop `items` của Select (để Select.Value hiện đúng label ngay từ đầu, không
// phải mở dropdown lần nào trước đó base-ui mới ghi nhớ được label) và để map ra SelectItem.
const STUDY_MODE_LABELS = {
  flip: 'Lật thẻ — xem nghĩa rồi tự đánh giá',
  type: 'Gõ tay — gõ đúng từ/nghĩa, app tự chấm',
}

function formatIntervalLabel(progress) {
  if (progress.intervalDays === 0) return 'ôn lại sau 10 phút'
  if (progress.intervalDays === 1) return 'ôn lại sau 1 ngày'
  return `ôn lại sau ${progress.intervalDays} ngày`
}

// Học từ vựng kiểu Anki/Quizlet: nạp file .md chứa flashcard (word/meaning/example...), chọn
// "Học thẻ đến hạn" (chỉ thẻ SRS đã due) hoặc "Học tất cả" (ôn lại toàn bộ bất kể due), lật từng
// thẻ xem nghĩa rồi tự đánh giá mức nhớ — app tính lại lần ôn tiếp theo theo SM-2 (features/srs).
// Độc lập hoàn toàn khỏi Quiz/TOEIC: không multiple-choice, không chấm đúng/sai, chỉ tự đánh giá.
export default function VocabPage() {
  const { allCards, files, loadFiles, removeFile, clearAll } = useVocabLibrary()
  const { ensureProgress, review, getDueCardIds } = useSrsProgress()
  const fileRef = useRef()
  const [showHelp, setShowHelp] = useState(false)
  const [studyMode, setStudyMode] = useState('flip') // 'flip' | 'type'
  const [useAllCount, setUseAllCount] = useState(true) // true = học hết pool đã chọn (đến hạn/tất cả), false = giới hạn theo limit
  const [limit, setLimit] = useState(20)
  const [queue, setQueue] = useState([]) // danh sách card đang học trong lượt này
  const [directions, setDirections] = useState([]) // chiều gõ của từng card trong queue, cố định khi bắt đầu lượt
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [reviewLog, setReviewLog] = useState([]) // [{ card, quality, progress }] — dùng để xuất kết quả

  useEffect(() => {
    if (allCards.length) ensureProgress(allCards.map(c => c.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ cần chạy lại khi số lượng/nội dung thẻ thay đổi, ensureProgress tự ổn định theo closure của useSrsProgress
  }, [allCards])

  const dueCount = getDueCardIds(allCards.map(c => c.id)).length

  const startSession = (onlyDue) => {
    const ids = onlyDue ? getDueCardIds(allCards.map(c => c.id)) : allCards.map(c => c.id)
    let cards = allCards.filter(c => ids.includes(c.id))
    if (!useAllCount && limit > 0 && limit < cards.length) {
      // Xáo trộn rồi lấy đúng N thẻ đầu — không ưu tiên thẻ nào, công bằng giữa cả pool đã chọn.
      cards = [...cards].sort(() => Math.random() - 0.5).slice(0, limit)
    }
    setQueue(cards)
    // Random chiều gõ cho mỗi thẻ 1 lần duy nhất lúc bắt đầu lượt — không random lại mỗi
    // render, để nội dung ổn định khi người học quay lại/nộp sớm giữa lượt.
    setDirections(cards.map(() => (Math.random() < 0.5 ? 'word' : 'meaning')))
    setCurrent(0)
    setFlipped(false)
    setSessionDone(false)
    setReviewLog([])
  }

  const handleReview = (key) => {
    const card = queue[current]
    const progress = review(card.id, REVIEW_QUALITY[key])
    setReviewLog(log => [...log, { card, quality: key, progress }])
    setFlipped(false)
    if (current < queue.length - 1) {
      setCurrent(c => c + 1)
    } else {
      setSessionDone(true)
    }
  }

  // Chế độ gõ tay: app tự chấm đúng/sai (không để người tự đánh giá 4 mức như Lật thẻ) — đúng
  // map sang quality Bình thường, sai map sang Quên, đơn giản và khách quan hơn.
  const handleTypingSubmit = (isCorrect) => {
    const card = queue[current]
    const key = isCorrect ? 'good' : 'forgot'
    const progress = review(card.id, REVIEW_QUALITY[key])
    setReviewLog(log => [...log, { card, quality: key, progress }])
    if (current < queue.length - 1) {
      setCurrent(c => c + 1)
    } else {
      setSessionDone(true)
    }
  }

  const exportResult = () => {
    const sourceNames = files.map(f => f.name)
    const { content, now } = buildVocabResultMarkdown(reviewLog, sourceNames)
    const baseName = sourceNames.length === 1 ? slugifyFilename(sourceNames[0]) : sourceNames.length > 1 ? 'nhieu-file' : 'tu-vung'
    downloadTextFile(`ket-qua-tu-vung_${baseName}_${formatTimestampForFilename(now)}.md`, content)
  }

  const resetSession = () => {
    setQueue([]); setCurrent(0); setFlipped(false); setSessionDone(false); setReviewLog([])
  }

  // Dừng sớm giữa lượt ôn, không cần lật hết hàng đợi mới xem/xuất kết quả.
  const submitNow = () => setSessionDone(true)

  return (
    <div className="flex min-h-[calc(100vh-var(--spacing-header-h))]">
      <main className="flex-1 overflow-y-auto flex flex-col items-center px-3.5 md:px-8 pt-4 md:pt-10 pb-8 md:pb-20">
        <div className="w-full max-w-[640px] flex flex-col gap-5">

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Học từ vựng</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileRef.current.click()}>+ Thêm file .md</Button>
              <input ref={fileRef} type="file" accept=".md" multiple className="hidden"
                onChange={e => loadFiles(e.target.files)} />
            </div>
          </div>

          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left -mt-2"
            onClick={() => setShowHelp(true)}
          >ℹ️ Xem hướng dẫn định dạng file .md</button>

          {allCards.length === 0 ? (
            <EmptyState />
          ) : queue.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col gap-4">
                <div className="text-sm text-muted-foreground">
                  Đã nạp <strong className="text-foreground">{allCards.length} thẻ</strong> từ {files.length} file.
                  {' '}<strong className="text-foreground">{dueCount} thẻ</strong> đến hạn ôn lại.
                </div>
                <div className="flex flex-col gap-2 max-w-xs">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kiểu học</span>
                  <Select value={studyMode} onValueChange={setStudyMode} items={STUDY_MODE_LABELS}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STUDY_MODE_LABELS).map(([v, label]) => (
                        <SelectItem key={v} value={v}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 max-w-xs">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Số lượng câu học</span>
                  <Label className="font-normal text-muted-foreground">
                    <Checkbox checked={useAllCount} onCheckedChange={v => setUseAllCount(!!v)} />
                    Dùng tất cả (đến hạn/tất cả tuỳ nút bấm)
                  </Label>
                  {!useAllCount && (
                    <div className="flex items-center gap-2.5">
                      <Input type="number" min={1} max={allCards.length} value={limit}
                        onChange={e => setLimit(Math.max(1, Math.min(allCards.length, +e.target.value)))} />
                      <span className="text-xs text-muted-foreground shrink-0">/ {allCards.length} thẻ</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => startSession(true)} disabled={!dueCount}>
                    ▶ Học thẻ đến hạn ({useAllCount ? dueCount : Math.min(limit, dueCount)})
                  </Button>
                  <Button variant="outline" onClick={() => startSession(false)}>
                    ↺ Học tất cả ({useAllCount ? allCards.length : Math.min(limit, allCards.length)})
                  </Button>
                </div>
                {files.length > 0 && (
                  <div className="flex flex-col gap-1 border-t pt-3">
                    {files.map(f => (
                      <div key={f.name} className="flex items-center justify-between text-xs gap-2">
                        <span className="text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap flex-1" title={f.name}>{f.name}</span>
                        <span className="text-muted-foreground shrink-0">{f.count} thẻ</span>
                        <Button variant="ghost" size="icon" className="shrink-0 size-5 rounded-full text-muted-foreground hover:text-destructive"
                          onClick={() => removeFile(f.name)}>✕</Button>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full h-8 mt-1 text-muted-foreground hover:text-destructive hover:border-destructive"
                      onClick={clearAll}>Xoá tất cả</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : sessionDone ? (
            <>
              <Card>
                <CardContent className="text-center flex flex-col gap-3 py-8">
                  <div className="text-4xl">🎉</div>
                  <p className="text-base">
                    {reviewLog.length === queue.length
                      ? `Đã ôn xong ${reviewLog.length} thẻ!`
                      : `Đã nộp sớm — ôn được ${reviewLog.length}/${queue.length} thẻ.`}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={exportResult} disabled={!reviewLog.length}>📥 Xuất kết quả (.md)</Button>
                    <Button onClick={resetSession}>Quay lại</Button>
                  </div>
                </CardContent>
              </Card>

              {reviewLog.length > 0 && (
                <div className="flex flex-col gap-2">
                  {reviewLog.map(({ card, quality, progress }, i) => (
                    <Card key={`${card.id}-${i}`}>
                      <CardContent className="flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">
                              {card.word}
                              {card.partOfSpeech && <span className="text-xs text-muted-foreground ml-1.5">({card.partOfSpeech})</span>}
                              {card.pronunciation && <span className="text-xs text-muted-foreground ml-1.5">{card.pronunciation}</span>}
                            </p>
                            <p className="text-sm text-muted-foreground">{card.meaning}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant={QUALITY_BADGE_VARIANT[quality]}>{QUALITY_LABEL[quality]}</Badge>
                            <span className="text-xs text-muted-foreground">{formatIntervalLabel(progress)}</span>
                          </div>
                        </div>
                        <CardRelatedInfo card={card} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : studyMode === 'type' ? (
            <TypingCardView
              key={queue[current].id}
              card={queue[current]}
              direction={directions[current]}
              current={current}
              total={queue.length}
              onSubmit={handleTypingSubmit}
              onSubmitEarly={reviewLog.length > 0 ? submitNow : null}
            />
          ) : (
            <>
              {reviewLog.length > 0 && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={submitNow}>🏁 Nộp & xem kết quả ({reviewLog.length} thẻ)</Button>
                </div>
              )}
              <FlashcardView
                card={queue[current]}
                current={current}
                total={queue.length}
                flipped={flipped}
                onFlip={() => setFlipped(f => !f)}
                onReview={handleReview}
              />
            </>
          )}
        </div>
      </main>
      {showHelp && <VocabHelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
