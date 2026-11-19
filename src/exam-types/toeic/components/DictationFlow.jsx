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
// câu hoàn thành và gọi onDone(selected) — PHẢI truyền đúng đáp án người dùng thật sự đã chọn ở
// bước 1 lên cho ToeicPage chấm điểm, không phải lúc nào cũng coi là đúng.
// answeredSelection: đáp án đã chọn từ lần làm trước (answers[i] của ToeicPage, nếu câu này đã
// trả lời) — dùng để khởi tạo lại đúng trạng thái đã chọn + xác nhận khi xem lại/mở bài làm dở,
// không chỉ dựa vào state nội bộ sẽ mất khi component unmount/reload.
// savedTranscriptInputs/onTranscriptInputsSaved: forward xuống TranscriptCheckInput để nội dung
// đã gõ cũng được ToeicPage lưu lại và khôi phục, không chỉ riêng đáp án đã chọn.
export default function DictationFlow({
  options, correctAnswer, transcript, part, hideOptionsText, matchThreshold,
  answeredSelection, savedTranscriptInputs, onTranscriptInputsSaved, onDone,
}) {
  const [selected, setSelected] = useState(answeredSelection ?? null)
  const [confirmed, setConfirmed] = useState(!!answeredSelection)
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
        <TranscriptCheckInput
          transcript={transcript}
          part={part}
          matchThreshold={matchThreshold}
          savedInputs={savedTranscriptInputs}
          onInputsSaved={onTranscriptInputsSaved}
          onChecked={() => onDone?.(selected)}
        />
      </div>
    </div>
  )
}
