import { Fragment, useState } from 'react'
import OptionItem from '@/components/OptionItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { matchPercent } from '../utils/transcriptMatch'

// Luồng "Nghe & gõ lại": chọn đáp án A/B/C/D VÀ gõ lại nguyên văn transcript hiện SONG SONG
// cùng lúc, trong 1 CSS Grid 2 cột thật (không phải 2 <div flex-col> riêng) — để mỗi HÀNG (option
// A đi với dòng transcript A, v.v.) tự cao bằng nhau theo max 2 bên, không bị lệch khi 1 bên nội
// dung dài hơn bên kia (vd OptionItem hiện text đáp án còn Input cố định h-10).
// - Chọn đáp án: click chỉ CHỌN TẠM (selected), có thể đổi ý nhiều lần trong lúc đang nghe tiếp —
//   giống chọn đáp án bình thường. Chỉ khi bấm "Xác nhận" (confirmed) mới chốt và hiện đúng/sai.
// - Gõ lại: mỗi dòng transcript có 1 ô nhập riêng, ẩn transcript gốc cho đến khi bấm "Kiểm tra".
// 2 việc độc lập, không chặn nhau. Chỉ khi gõ lại xong mới coi câu hoàn thành và gọi onDone.
//
// Field transcript trong .md là multiline (transcript: |), MỖI DÒNG ứng với MỘT câu audio đọc
// riêng — Part 1: 4 dòng (mô tả A-D, khớp 1-1 với 4 OptionItem); Part 2: dòng đầu là câu hỏi (Q,
// không có OptionItem tương ứng — ghép vào hàng đầu cùng với dòng chữ "(Nghe audio để biết câu
// hỏi)" bên cột trái) + 3 dòng sau là 3 đáp án A/B/C; Part 3-4: từng lượt thoại "Woman:"/"Man:"
// (nhãn loại bỏ khi chấm), không có cột trái tương ứng.
function splitTranscriptLines(transcript) {
  return transcript
    .split('\n')
    .map(line => line.replace(/^(Woman|Man):\s*/i, '').trim())
    .filter(Boolean)
}

// Nhãn ngắn đặt trong khung vuông đầu mỗi ô gõ lại, cùng cỡ với ký tự A/B/C/D của OptionItem để
// 2 cột thẳng hàng. Part 1 các dòng đều là ĐÁP ÁN (A-D); Part 2 dòng đầu là câu hỏi nên dùng "Q".
function lineLabel(part, idx) {
  if (part === 1) return String.fromCharCode(65 + idx)
  if (part === 2) return idx === 0 ? 'Q' : String.fromCharCode(64 + idx)
  return String(idx + 1)
}

// answeredSelection: đáp án đã chọn từ lần làm trước (answers[i] của ToeicPage, nếu câu này đã
// trả lời) — dùng để khởi tạo lại đúng trạng thái đã chọn + xác nhận khi xem lại/mở bài làm dở.
// savedTranscriptInputs/onTranscriptInputsSaved: ToeicPage lưu lại nội dung đã gõ để xuất file/
// lưu làm dở/nạp lại không bị mất, không chỉ sống trong state nội bộ của component này.
export default function DictationFlow({
  options, correctAnswer, transcript, part, hideOptionsText, matchThreshold,
  answeredSelection, savedTranscriptInputs, onTranscriptInputsSaved, onDone,
}) {
  const [selected, setSelected] = useState(answeredSelection ?? null)
  const [confirmed, setConfirmed] = useState(!!answeredSelection)
  const isCorrectChoice = selected === correctAnswer

  const lines = splitTranscriptLines(transcript)
  const [inputs, setInputs] = useState(() => savedTranscriptInputs ?? lines.map(() => ''))
  const [checked, setChecked] = useState(() => !!savedTranscriptInputs)

  const percents = checked ? lines.map((line, idx) => matchPercent(inputs[idx] ?? '', line)) : null
  const results = percents?.map(p => p >= matchThreshold)
  const correctCount = results?.filter(Boolean).length ?? 0
  const avgPct = percents?.length ? Math.round(percents.reduce((s, p) => s + p, 0) / percents.length) : 0
  const allCorrect = checked && correctCount === lines.length

  const handleCheckTranscript = () => {
    if (checked) return
    setChecked(true)
    onTranscriptInputsSaved?.(inputs)
    onDone?.(selected)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !checked) handleCheckTranscript()
  }

  const optionKeys = Object.keys(options)
  // Part 2 có 1 dòng transcript (câu hỏi, idx 0) không khớp OptionItem nào — hàng đầu bên trái là
  // dòng chữ tĩnh thay vì OptionItem. Các Part khác, optionKeys và lines khớp 1-1 theo index.
  const hasLeadingQuestionLine = part === 2
  const rowCount = Math.max(optionKeys.length + (hasLeadingQuestionLine ? 1 : 0), lines.length)

  const rows = Array.from({ length: rowCount }, (_, row) => {
    const optionIdx = hasLeadingQuestionLine ? row - 1 : row
    const optionKey = optionKeys[optionIdx]
    const left = optionKey
      ? (
        <OptionItem
          optionKey={optionKey}
          text={options[optionKey]}
          hideText={hideOptionsText}
          status={confirmed ? (optionKey === selected ? (isCorrectChoice ? 'correct' : 'wrong') : 'none') : (optionKey === selected ? 'selected' : 'none')}
          disabled={confirmed}
          onClick={() => setSelected(optionKey)}
          className="h-full"
        />
      )
      : row === 0 && hasLeadingQuestionLine
        ? (
          <div className="h-full flex items-center justify-center text-center bg-card border-[1.5px] border-border rounded-lg px-4 py-3">
            <span className="text-sm text-muted-foreground italic">(Nghe audio để biết câu hỏi)</span>
          </div>
        )
        : null

    const label = lineLabel(part, row)
    const isCorrect = results?.[row]
    const pct = percents?.[row]
    const right = row < lines.length
      ? (
        <div className="flex items-center gap-3 h-full">
          <span className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground">
            {label}
          </span>
          {!checked ? (
            <Input
              value={inputs[row]}
              onChange={e => setInputs(prev => prev.map((v, i) => (i === row ? e.target.value : v)))}
              onKeyDown={handleKeyDown}
              placeholder="Gõ lại điều bạn nghe được..."
            />
          ) : (
            <div className={`rounded-lg border px-3.5 py-2.5 text-sm flex items-center gap-2 flex-1 min-w-0 h-10 ${isCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'}`}>
              <Badge variant={isCorrect ? 'default' : 'destructive'} className={`shrink-0 ${isCorrect ? 'bg-success text-success-foreground' : ''}`}>
                {pct}%
              </Badge>
              <span className="min-w-0 truncate">{inputs[row] || <span className="text-muted-foreground italic">(bỏ trống)</span>}</span>
            </div>
          )}
        </div>
      )
      : null

    return { left, right }
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-stretch">
        <p className="text-xs text-muted-foreground font-medium">Chọn đáp án</p>
        <p className="text-xs text-muted-foreground font-medium">Gõ lại nguyên văn đã nghe</p>
        {rows.map((r, row) => (
          <Fragment key={row}>
            <div>{r.left}</div>
            <div>{r.right}</div>
          </Fragment>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        {!confirmed ? (
          <Button size="sm" variant="outline" onClick={() => setConfirmed(true)} disabled={!selected}>Xác nhận</Button>
        ) : (
          <div className={`rounded-lg border px-3.5 py-2.5 text-sm font-semibold ${isCorrectChoice ? 'border-success bg-success/10 text-success' : 'border-destructive bg-destructive/10 text-destructive'}`}>
            {isCorrectChoice ? '✓ Chọn đúng' : '✗ Chọn sai'}
          </div>
        )}
        {!checked ? (
          <Button size="sm" variant="outline" onClick={handleCheckTranscript} disabled={inputs.some(v => !v.trim())}>Kiểm tra</Button>
        ) : (
          <div className={`flex-1 flex items-center justify-between rounded-lg border px-3.5 py-2 text-sm ${allCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'}`}>
            <span className={allCorrect ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
              {allCorrect ? '✓ Nghe đúng hết' : `✗ Đúng ${correctCount}/${lines.length}`}
            </span>
            <span className="text-muted-foreground">Trung bình {avgPct}% khớp</span>
          </div>
        )}
      </div>
    </div>
  )
}
