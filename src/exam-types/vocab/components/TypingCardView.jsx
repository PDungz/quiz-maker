import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { isAnswerCorrect } from '../utils/matchAnswer'
import CardRelatedInfo from './CardRelatedInfo'

// Chế độ gõ tay: mỗi thẻ random 1 chiều — "word": hiện nghĩa, gõ đúng từ tiếng Anh; "meaning":
// hiện từ, gõ đúng nghĩa. App tự chấm bằng khớp gần đúng (isAnswerCorrect), khác hẳn chế độ Lật
// thẻ (người tự đánh giá 4 mức) — gõ tay chỉ có đúng/sai, quality tương ứng Good/Quên. Sau khi
// chấm, hiện thêm thông tin phụ của thẻ (ví dụ, họ từ, đồng/đối nghĩa...) giống mặt sau
// FlashcardView — gõ đúng/sai chỉ là bước kiểm tra nhanh, không thay thế việc học đầy đủ ngữ cảnh.
export default function TypingCardView({ card, direction, current, total, onSubmit, onSubmitEarly }) {
  const [input, setInput] = useState('')
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(false)

  const prompt = direction === 'word' ? card.meaning : card.word
  const answer = direction === 'word' ? card.word : card.meaning
  const promptLabel = direction === 'word' ? 'Nghĩa — gõ từ tiếng Anh' : 'Từ — gõ nghĩa'

  const handleCheck = () => {
    if (checked) return
    setCorrect(isAnswerCorrect(input, answer))
    setChecked(true)
  }

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return
    if (!checked) handleCheck()
    else onSubmit(correct)
  }

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="w-full max-w-md flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{current + 1} / {total}</span>
        {onSubmitEarly && (
          <Button variant="outline" size="sm" onClick={onSubmitEarly}>🏁 Nộp & xem kết quả</Button>
        )}
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-4">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{promptLabel}</span>
            <p className="text-xl font-semibold mt-1">{prompt}</p>
          </div>

          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={checked}
            placeholder={direction === 'word' ? 'Gõ từ tiếng Anh...' : 'Gõ nghĩa...'}
            autoFocus
          />

          {checked && (
            <>
              <div className={`rounded-lg border px-3.5 py-2.5 text-sm ${correct ? 'border-success text-success bg-success/10' : 'border-destructive text-destructive bg-destructive/10'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={correct ? 'default' : 'destructive'} className={correct ? 'bg-success text-success-foreground' : ''}>
                    {correct ? '✓ Đúng' : '✗ Sai'}
                  </Badge>
                </div>
                <p>Đáp án đúng: <strong>{answer}</strong></p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <CardRelatedInfo card={card} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!checked ? (
        <Button className="w-full max-w-md" onClick={handleCheck} disabled={!input.trim()}>Kiểm tra</Button>
      ) : (
        <Button className="w-full max-w-md" onClick={() => onSubmit(correct)}>
          {current < total - 1 ? 'Câu tiếp theo →' : 'Hoàn thành'}
        </Button>
      )}
    </div>
  )
}
