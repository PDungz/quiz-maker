import { getPoint } from '../../../utils/quiz'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import OptionItem from '@/components/OptionItem'
import { ExplanationText } from '../../../features/results'

// UI hiển thị 1 câu hỏi dạng Quiz thường (1 câu + danh sách đáp án đơn giản).
// Khác với TOEIC/IELTS sau này — nơi nhiều câu hỏi có thể chia sẻ 1 đoạn văn/audio chung.
export default function QuestionView({
  q, current, questions, isMulti, sel, answered, locked, allDone, lockPrevious, timeUp,
  scoreMode, pointMode, customPoints,
  getOptionStatus, toggleOption, isRevealed,
  onPrev, onNext, onStepForward, onSkip, onConfirm, onSubmit,
}) {
  return (
    <div className="flex flex-col gap-4">
      {timeUp && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg px-4 py-3 text-sm">
          ⏰ Đã hết giờ — bài làm được tự động nộp
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        {q.category && <Badge variant="outline">{q.category}</Badge>}
        {q.difficulty && <Badge variant="secondary">{q.difficulty}</Badge>}
        {isMulti && <Badge variant="outline">Nhiều đáp án</Badge>}
        {scoreMode === 'point' && <Badge variant="secondary">{getPoint(q, pointMode, customPoints)} điểm</Badge>}
        {q.id && <Badge variant="outline">{q.id}</Badge>}
        <span className="ml-auto text-sm text-muted-foreground">
          {current + 1} / {questions.length}
        </span>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3.5">
          <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">{q.question}</p>
          {q.code && (
            <pre className="relative bg-muted border border-border rounded-lg p-3.5 overflow-x-auto font-mono text-[0.83rem] leading-relaxed whitespace-pre">
              {q.code_lang && (
                <span className="absolute top-1.5 right-2.5 text-[0.65rem] text-muted-foreground font-sans uppercase tracking-wide">{q.code_lang}</span>
              )}
              <code>{q.code}</code>
            </pre>
          )}
        </CardContent>
      </Card>

      {isMulti && !answered && (
        <p className="text-sm text-muted-foreground px-3 py-1.5 bg-muted rounded-md inline-block w-fit">
          Chọn tất cả đáp án đúng rồi bấm Xác nhận
        </p>
      )}

      <div className="flex flex-col gap-2">
        {Object.entries(q.options).map(([key, val]) => (
          <OptionItem
            key={key}
            optionKey={key}
            text={val}
            status={getOptionStatus(key)}
            disabled={answered || locked}
            onClick={() => toggleOption(key)}
          />
        ))}
      </div>

      {isRevealed && q.explanation && (
        <div className="bg-muted border border-border border-l-[3px] border-l-muted-foreground rounded-lg p-3.5">
          <h4 className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-semibold">Giải thích</h4>
          <ExplanationText text={q.explanation} className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed" />
        </div>
      )}

      {!locked && (
        <div className="flex justify-between items-center flex-wrap gap-2">
          {lockPrevious ? <span /> : (
            <Button variant="outline" onClick={onPrev} disabled={current === 0}>← Trước</Button>
          )}
          <div className="flex gap-2">
            {!answered ? (
              <>
                <Button variant="outline" onClick={onSkip}>Bỏ qua</Button>
                <Button onClick={onConfirm} disabled={!sel.size}>Xác nhận</Button>
              </>
            ) : current < questions.length - 1 ? (
              <Button onClick={onNext}>Tiếp theo →</Button>
            ) : (
              <Button onClick={onSubmit}>Nộp bài 🏁</Button>
            )}
          </div>
        </div>
      )}

      {locked && !allDone && (
        <div className="flex justify-between items-center flex-wrap gap-2">
          <Button variant="outline" onClick={onPrev} disabled={current === 0}>← Trước</Button>
          <Button variant="outline" onClick={onStepForward} disabled={current === questions.length - 1}>Sau →</Button>
        </div>
      )}
    </div>
  )
}
