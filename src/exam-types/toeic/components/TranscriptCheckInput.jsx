import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { matchPercent } from '../utils/transcriptMatch'

// Chế độ "Nghe & gõ lại" cho Listening (Part 1-4) ở tab Học: thay vì click chọn đáp án, người
// học nghe audio rồi gõ lại nguyên văn từng câu đã nghe. Field transcript trong .md là multiline
// (transcript: |), MỖI DÒNG ứng với MỘT câu audio đọc riêng — Part 1: 4 dòng (mô tả A-D), Part 2:
// dòng đầu là câu hỏi + 3 dòng sau là 3 đáp án, Part 3-4: từng lượt thoại "Woman:"/"Man:" (nhãn
// loại bỏ khi chấm). Mỗi dòng có 1 ô nhập riêng, chấm theo % từ khớp (matchThreshold) thay vì đòi
// khớp tuyệt đối — thiếu/sai vài từ trong câu dài vẫn có thể đạt nếu đủ ngưỡng.
//
// Component này TỰ GIỮ trạng thái đã chấm (checked) và không bao giờ bị thay bằng 1 khối tóm tắt
// khác ở ngoài — PassageQuestionGroup luôn render component này kể cả sau khi đã trả lời, để giữ
// nguyên đúng những gì người học đã gõ + kết quả đối chiếu từng dòng.
function splitTranscriptLines(transcript) {
  return transcript
    .split('\n')
    .map(line => line.replace(/^(Woman|Man):\s*/i, '').trim())
    .filter(Boolean)
}

// Nhãn từng dòng theo đúng vai trò trong transcript, không gọi chung "Câu N" vì Part 1 các dòng
// đều là ĐÁP ÁN (A-D), không phải câu hỏi riêng biệt — dễ gây hiểu nhầm.
function lineLabel(part, idx, total) {
  if (part === 1) return `Đáp án ${String.fromCharCode(65 + idx)}`
  if (part === 2) return idx === 0 ? 'Câu hỏi' : `Đáp án ${String.fromCharCode(64 + idx)}`
  if (total > 1) return `Lượt ${idx + 1}`
  return null
}

export default function TranscriptCheckInput({ transcript, part, matchThreshold = 80, onChecked }) {
  const lines = splitTranscriptLines(transcript)
  const [inputs, setInputs] = useState(() => lines.map(() => ''))
  const [checked, setChecked] = useState(false)

  const percents = checked ? lines.map((line, idx) => matchPercent(inputs[idx], line)) : null
  const results = percents?.map(p => p >= matchThreshold)
  const correctCount = results?.filter(Boolean).length ?? 0
  const avgPct = percents?.length ? Math.round(percents.reduce((s, p) => s + p, 0) / percents.length) : 0
  const allCorrect = checked && correctCount === lines.length

  const handleCheck = () => {
    if (checked) return
    setChecked(true)
    const ok = lines.every((line, idx) => matchPercent(inputs[idx], line) >= matchThreshold)
    onChecked?.(ok)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !checked) handleCheck()
  }

  return (
    <div className="flex flex-col gap-2">
      {checked && (
        <div className={`flex items-center justify-between rounded-lg border px-3.5 py-2 text-sm ${allCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'}`}>
          <span className={allCorrect ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
            {allCorrect ? '✓ Nghe đúng hết' : `✗ Đúng ${correctCount}/${lines.length}`}
          </span>
          <span className="text-muted-foreground">Trung bình {avgPct}% khớp</span>
        </div>
      )}
      {lines.map((line, idx) => {
        const label = lineLabel(part, idx, lines.length)
        const isCorrect = results?.[idx]
        const pct = percents?.[idx]
        return (
          <div key={idx} className="flex flex-col gap-1">
            {label && <span className="text-xs text-muted-foreground font-medium">{label}</span>}
            <div className="grid grid-cols-2 gap-2 items-stretch">
              <div className="rounded-lg border bg-muted px-3.5 py-2.5 text-sm flex items-center">{line}</div>
              {!checked ? (
                <Input
                  value={inputs[idx]}
                  onChange={e => setInputs(prev => prev.map((v, i) => (i === idx ? e.target.value : v)))}
                  onKeyDown={handleKeyDown}
                  placeholder="Gõ lại điều bạn nghe được..."
                />
              ) : (
                <div className={`rounded-lg border px-3.5 py-2.5 text-sm flex items-center gap-2 ${isCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'}`}>
                  <Badge variant={isCorrect ? 'default' : 'destructive'} className={`shrink-0 ${isCorrect ? 'bg-success text-success-foreground' : ''}`}>
                    {pct}%
                  </Badge>
                  <span className="min-w-0 truncate">{inputs[idx] || <span className="text-muted-foreground italic">(bỏ trống)</span>}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
      {!checked && (
        <Button size="sm" variant="outline" className="self-end" onClick={handleCheck} disabled={inputs.some(v => !v.trim())}>Kiểm tra</Button>
      )}
    </div>
  )
}
