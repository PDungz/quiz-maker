import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

function FieldLabel({ children }) {
  return <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</Label>
}

const PART_LABEL = {
  1: 'Part 1 — Mô tả tranh',
  2: 'Part 2 — Hỏi đáp',
  3: 'Part 3 — Đoạn hội thoại',
  4: 'Part 4 — Bài nói ngắn',
  5: 'Part 5 — Hoàn thành câu',
  6: 'Part 6 — Hoàn thành đoạn văn',
  7: 'Part 7 — Đọc hiểu',
}

// Cấu hình riêng cho TOEIC: chọn Luyện tập/Thi thử + chọn Part có sẵn trong file đã nạp.
// Phần còn lại (timer, chấm điểm, retry...) tái dùng nguyên features/quiz-session + results.
export default function ToeicSetupSidebar({
  partCounts, selectedParts, togglePart, setSelectedParts,
  examStyle, setExamStyle,
  splitByPart, setSplitByPart,
  timerMinutes, setTimerMinutes,
  practiceTimerEnabled, setPracticeTimerEnabled,
  poolSize, onBuildQuiz, hasQuestions,
}) {
  const parts = Object.keys(partCounts).map(Number).sort((a, b) => a - b)
  // selectedParts rỗng nghĩa là "không lọc gì" = dùng tất cả Part, nên coi như đã chọn hết
  const allSelected = selectedParts.length === 0 || parts.every(p => selectedParts.includes(p))

  return (
    <div className="flex flex-col gap-5 border-t pt-5 mt-2">
      <div className="flex flex-col gap-2">
        <FieldLabel>Hình thức</FieldLabel>
        <Select value={examStyle} onValueChange={setExamStyle}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="practice">Luyện tập — xem đáp án ngay, không giới hạn giờ</SelectItem>
            <SelectItem value="test">Thi thử — mô phỏng thi thật, chấm sau khi nộp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel>Chọn Part</FieldLabel>
        <div className="flex flex-col gap-2">
          <Label className="font-normal text-muted-foreground">
            <Checkbox
              checked={allSelected}
              onCheckedChange={v => setSelectedParts(v ? parts : [])}
            />
            Chọn tất cả
          </Label>
          <div className="h-px bg-border my-0.5" />
          {parts.map(part => (
            <Label key={part} className="font-normal text-muted-foreground">
              <Checkbox checked={allSelected || selectedParts.includes(part)} onCheckedChange={() => togglePart(part, parts)} />
              {PART_LABEL[part] ?? `Part ${part}`}
              <Badge variant="secondary" className="ml-auto shrink-0">{partCounts[part]} câu</Badge>
            </Label>
          ))}
        </div>
      </div>

      {examStyle === 'practice' && (
        <div className="flex flex-col gap-2">
          <FieldLabel>Giới hạn thời gian</FieldLabel>
          <Label className="font-normal text-muted-foreground">
            <Checkbox checked={practiceTimerEnabled} onCheckedChange={v => setPracticeTimerEnabled(!!v)} />
            Bật đếm giờ (chỉ để tham khảo, hết giờ không tự nộp bài)
          </Label>
          {practiceTimerEnabled && (
            <div className="flex items-center gap-2.5">
              <Input type="number" min={1} max={600} value={timerMinutes}
                onChange={e => setTimerMinutes(Math.max(1, +e.target.value))} />
              <span className="text-xs text-muted-foreground shrink-0">phút</span>
            </div>
          )}
        </div>
      )}

      {examStyle === 'test' && (
        <div className="flex flex-col gap-2">
          <FieldLabel>Giới hạn thời gian</FieldLabel>
          <div className="flex items-center gap-2.5">
            <Input type="number" min={1} max={600} value={timerMinutes}
              onChange={e => setTimerMinutes(Math.max(1, +e.target.value))} />
            <span className="text-xs text-muted-foreground shrink-0">phút</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <FieldLabel>Hiển thị danh sách câu hỏi</FieldLabel>
        <Select value={splitByPart ? 'split' : 'all'} onValueChange={v => setSplitByPart(v === 'split')}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="split">Chia theo tab Part</SelectItem>
            <SelectItem value="all">Cuộn tất cả, không chia Part</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button size="lg" className="w-full" onClick={onBuildQuiz} disabled={!poolSize}>
        {hasQuestions ? '↺ Làm lại' : '▶ Bắt đầu'} ({poolSize} câu)
      </Button>
    </div>
  )
}
