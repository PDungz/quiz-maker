import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { isAnswerCorrect } from '../../vocab/utils/matchAnswer'

// Chế độ "Nghe & gõ lại" cho Listening (Part 1-4) ở tab Học: thay vì click chọn đáp án, người
// học nghe audio rồi gõ lại nguyên văn từng câu đã nghe. Field transcript trong .md là multiline
// (transcript: |), MỖI DÒNG ứng với MỘT câu audio đọc riêng — Part 1: 4 dòng (mô tả A-D), Part 2:
// dòng đầu là câu hỏi + 3 dòng sau là 3 đáp án, Part 3-4: từng lượt thoại "Woman:"/"Man:" (nhãn
// loại bỏ khi chấm). Mỗi dòng có 1 ô nhập riêng, chấm gần đúng bằng isAnswerCorrect (cùng hàm
// dùng cho gõ tay ở Từ vựng). Transcript 1 dòng (Part 3-4 không tách lượt) vẫn hoạt động như cũ.
function splitTranscriptLines(transcript) {
  return transcript
    .split('\n')
    .map(line => line.replace(/^(Woman|Man):\s*/i, '').trim())
    .filter(Boolean)
}

export default function TranscriptCheckInput({ transcript, onChecked }) {
  const lines = splitTranscriptLines(transcript)
  const [inputs, setInputs] = useState(() => lines.map(() => ''))
  const [checked, setChecked] = useState(false)

  const results = checked ? lines.map((line, idx) => isAnswerCorrect(inputs[idx], line)) : null
  const allCorrect = results?.every(Boolean) ?? false

  const handleCheck = () => {
    if (checked) return
    setChecked(true)
    const ok = lines.every((line, idx) => isAnswerCorrect(inputs[idx], line))
    onChecked?.(ok)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !checked) handleCheck()
  }

  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, idx) => (
        <div key={idx} className="flex flex-col gap-1">
          <Input
            value={inputs[idx]}
            onChange={e => setInputs(prev => prev.map((v, i) => (i === idx ? e.target.value : v)))}
            onKeyDown={handleKeyDown}
            disabled={checked}
            placeholder={lines.length > 1 ? `Câu ${idx + 1}: gõ lại điều bạn nghe được...` : 'Gõ lại câu bạn nghe được...'}
            className={checked ? (results[idx] ? 'border-success' : 'border-destructive') : ''}
          />
          {checked && !results[idx] && (
            <p className="text-xs text-destructive">Gốc: <strong>{line}</strong></p>
          )}
        </div>
      ))}
      {!checked ? (
        <Button size="sm" variant="outline" className="self-end" onClick={handleCheck} disabled={inputs.some(v => !v.trim())}>Kiểm tra</Button>
      ) : (
        <Badge variant={allCorrect ? 'default' : 'destructive'} className={`self-start ${allCorrect ? 'bg-success text-success-foreground' : ''}`}>
          {allCorrect ? '✓ Nghe đúng hết' : `✗ Đúng ${results.filter(Boolean).length}/${lines.length}`}
        </Badge>
      )}
    </div>
  )
}
