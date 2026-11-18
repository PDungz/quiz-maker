import { useState } from 'react'
import OptionItem from '@/components/OptionItem'
import { Button } from '@/components/ui/button'
import TranscriptCheckInput from './TranscriptCheckInput'

// Luồng "Nghe & gõ lại" đủ 2 bước, mô phỏng nghe audio 2 lần như hướng dẫn thi thật:
// 1) Nghe lần 1 → chọn đáp án A/B/C/D như bình thường (radio), kiểm tra → chỉ báo đúng/sai ngay,
//    KHÔNG lộ text đáp án (tránh gợi ý trước khi gõ) dù hideListeningText tắt hay bật.
// 2) Nghe lần 2 → gõ lại transcript (TranscriptCheckInput), chỉ hiện sau khi xong bước 1.
// Chọn sai ở bước 1 vẫn cho làm tiếp bước 2 bình thường — 2 bước độc lập, không chặn nhau.
// Chỉ sau khi xong CẢ 2 bước mới coi câu là hoàn thành (gọi onDone để hiện giải thích).
export default function DictationFlow({ options, correctAnswer, transcript, part, hideOptionsText, onDone }) {
  const [selected, setSelected] = useState(null)
  const [step1Checked, setStep1Checked] = useState(false)
  const step1Correct = step1Checked && selected === correctAnswer

  const handleCheckStep1 = () => {
    if (!selected) return
    setStep1Checked(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground font-medium">Bước 1 — Nghe lần 1, chọn đáp án</p>
        {Object.entries(options).map(([key, val]) => (
          <OptionItem
            key={key}
            optionKey={key}
            text={val}
            hideText={hideOptionsText}
            status={step1Checked ? (key === selected ? (step1Correct ? 'correct' : 'wrong') : 'none') : (key === selected ? 'selected' : 'none')}
            disabled={step1Checked}
            onClick={() => setSelected(key)}
          />
        ))}
        {!step1Checked ? (
          <Button size="sm" variant="outline" className="self-end" onClick={handleCheckStep1} disabled={!selected}>Kiểm tra đáp án</Button>
        ) : (
          <div className={`rounded-lg border px-3.5 py-2.5 text-sm font-semibold ${step1Correct ? 'border-success bg-success/10 text-success' : 'border-destructive bg-destructive/10 text-destructive'}`}>
            {step1Correct ? '✓ Chọn đúng' : '✗ Chọn sai'}
          </div>
        )}
      </div>

      {step1Checked && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <p className="text-xs text-muted-foreground font-medium">Bước 2 — Nghe lần 2, gõ lại nguyên văn</p>
          <TranscriptCheckInput transcript={transcript} part={part} onChecked={() => onDone?.()} />
        </div>
      )}
    </div>
  )
}
