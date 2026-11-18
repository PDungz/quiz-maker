import { useState } from 'react'
import OptionItem from '@/components/OptionItem'
import { Button } from '@/components/ui/button'
import TranscriptCheckInput from './TranscriptCheckInput'

// Luồng "Nghe & gõ lại": chọn đáp án A/B/C/D VÀ gõ lại nguyên văn transcript hiện SONG SONG
// cùng lúc, không tách thành 2 bước tuần tự.
// - Chọn đáp án: click chỉ CHỌN TẠM (selected), có thể đổi ý nhiều lần trong lúc đang nghe tiếp —
//   giống chọn đáp án bình thường. Chỉ khi bấm "Xác nhận" (confirmed) mới chốt và hiện đúng/sai.
// - Gõ lại: TranscriptCheckInput tự ẩn nội dung gốc cho đến khi bấm "Kiểm tra" của chính nó.
// 2 việc độc lập, không chặn nhau. Chỉ khi gõ lại xong (TranscriptCheckInput onChecked) mới coi
// câu hoàn thành và gọi onDone để hiện giải thích.
export default function DictationFlow({ options, correctAnswer, transcript, part, hideOptionsText, matchThreshold, onDone }) {
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const isCorrectChoice = selected === correctAnswer

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground font-medium">Chọn đáp án</p>
        {Object.entries(options).map(([key, val]) => (
          <OptionItem
            key={key}
            optionKey={key}
            text={val}
            hideText={hideOptionsText}
            status={confirmed ? (key === selected ? (isCorrectChoice ? 'correct' : 'wrong') : 'none') : (key === selected ? 'selected' : 'none')}
            disabled={confirmed}
            onClick={() => setSelected(key)}
          />
        ))}
        {!confirmed ? (
          <Button size="sm" variant="outline" className="self-end" onClick={() => setConfirmed(true)} disabled={!selected}>Xác nhận</Button>
        ) : (
          <div className={`rounded-lg border px-3.5 py-2.5 text-sm font-semibold ${isCorrectChoice ? 'border-success bg-success/10 text-success' : 'border-destructive bg-destructive/10 text-destructive'}`}>
            {isCorrectChoice ? '✓ Chọn đúng' : '✗ Chọn sai'}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground font-medium">Gõ lại nguyên văn đã nghe</p>
        <TranscriptCheckInput transcript={transcript} part={part} matchThreshold={matchThreshold} onChecked={() => onDone?.()} />
      </div>
    </div>
  )
}
