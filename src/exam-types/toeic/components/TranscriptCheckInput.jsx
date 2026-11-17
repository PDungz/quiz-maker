import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { isAnswerCorrect } from '../../vocab/utils/matchAnswer'

// Chế độ "Nghe & gõ lại" cho Listening (Part 1-4) ở tab Học: thay vì click chọn đáp án, người
// học nghe audio rồi gõ lại nguyên văn câu đã nghe, app chấm gần đúng (isAnswerCorrect, cùng hàm
// dùng cho gõ tay ở Từ vựng) so với field transcript khai báo trong .md. Khác việc chọn đáp án
// A/B/C/D — mục tiêu là luyện nghe chép, không phải luyện loại trừ đáp án.
export default function TranscriptCheckInput({ transcript, onChecked }) {
  const [input, setInput] = useState('')
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(false)

  const handleCheck = () => {
    if (checked) return
    const ok = isAnswerCorrect(input, transcript)
    setCorrect(ok)
    setChecked(true)
    onChecked?.(ok)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !checked) handleCheck()
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={checked}
        placeholder="Gõ lại câu bạn nghe được..."
      />
      {!checked ? (
        <Button size="sm" variant="outline" className="self-end" onClick={handleCheck} disabled={!input.trim()}>Kiểm tra</Button>
      ) : (
        <div className={`rounded-lg border px-3.5 py-2.5 text-sm ${correct ? 'border-success text-success bg-success/10' : 'border-destructive text-destructive bg-destructive/10'}`}>
          <Badge variant={correct ? 'default' : 'destructive'} className={correct ? 'bg-success text-success-foreground mb-1' : 'mb-1'}>
            {correct ? '✓ Nghe đúng' : '✗ Chưa khớp'}
          </Badge>
          <p>Transcript gốc: <strong>{transcript}</strong></p>
        </div>
      )}
    </div>
  )
}
