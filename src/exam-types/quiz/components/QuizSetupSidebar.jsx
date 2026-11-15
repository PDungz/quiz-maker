import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

function FieldLabel({ children }) {
  return <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</Label>
}

// Form cấu hình trước khi làm bài, riêng cho loại đề thi Quiz: chủ đề, thứ tự, số câu,
// timer + thi thật, thời điểm chấm điểm, khoá câu trước, cách tính điểm, tỉ lệ đậu.
//
// Khoảng cách GIỮA các mục luôn đến từ `gap-5` của container ngoài cùng — không set margin
// riêng ở từng mục. Muốn đổi khoảng cách toàn sidebar: sửa đúng 1 số ở đây.
export default function QuizSetupSidebar({
  categories, selectedCats, toggleCat,
  mode, setMode, useAll, setUseAll, limit, setLimit, poolSize,
  timerEnabled, setTimerEnabled, timerMinutes, setTimerMinutes, examMode, setExamMode,
  revealMode, setRevealMode, lockPrevious, setLockPrevious,
  scoreMode, setScoreMode, pointMode, setPointMode, customPoints, setCustomPoints,
  passPct, setPassPct,
  retryPool, previousResult, onShowPreviousResult, onCancelRetryPool,
  onBuildQuiz, hasQuestions,
}) {
  return (
    <div className="flex flex-col gap-5 border-t pt-5 mt-2">
      {retryPool ? (
        <Card className="bg-muted">
          <CardContent className="flex flex-col gap-3 text-sm">
            <div>🔁 Đang chuẩn bị làm lại <strong>{retryPool.length} câu</strong> đã chọn</div>
            {previousResult && (
              <Button variant="link" className="h-auto p-0 justify-start text-xs text-muted-foreground" onClick={onShowPreviousResult}>
                👁 Xem kết quả trước đó
              </Button>
            )}
            <Button variant="link" className="h-auto p-0 justify-start text-xs text-muted-foreground" onClick={onCancelRetryPool}>
              Huỷ, quay lại bình thường
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          <FieldLabel>Chủ đề</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Badge
                key={cat}
                variant={selectedCats.includes(cat) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleCat(cat)}
              >{cat}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <FieldLabel>Thứ tự</FieldLabel>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="shuffle">Xáo trộn (random)</SelectItem>
            <SelectItem value="category">Theo thứ tự trong file</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!retryPool && (
        <div className="flex flex-col gap-2">
          <FieldLabel>Số câu sử dụng</FieldLabel>
          <Label className="font-normal text-muted-foreground">
            <Checkbox checked={useAll} onCheckedChange={v => setUseAll(!!v)} />
            Dùng tất cả ({poolSize} câu)
          </Label>
          {!useAll && (
            <div className="flex items-center gap-2.5">
              <Input type="number" min={1} max={poolSize} value={limit}
                onChange={e => setLimit(Math.max(1, Math.min(poolSize, +e.target.value)))} />
              <span className="text-xs text-muted-foreground shrink-0">/ {poolSize}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <FieldLabel>Giới hạn thời gian</FieldLabel>
        <Label className="font-normal text-muted-foreground">
          <Checkbox checked={timerEnabled} onCheckedChange={v => setTimerEnabled(!!v)} />
          Bật đếm giờ
        </Label>
        {timerEnabled && (
          <>
            <div className="flex items-center gap-2.5">
              <Input type="number" min={1} max={600} value={timerMinutes}
                onChange={e => setTimerMinutes(Math.max(1, +e.target.value))} />
              <span className="text-xs text-muted-foreground shrink-0">phút</span>
            </div>
            <Label className="font-normal text-muted-foreground items-start">
              <Checkbox className="mt-0.5" checked={examMode} onCheckedChange={v => setExamMode(!!v)} />
              <span>Chế độ thi thật (không dừng giờ, không xem đáp án/kết quả cho tới khi nộp bài)</span>
            </Label>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel>Thời điểm chấm điểm</FieldLabel>
        <Select value={revealMode} onValueChange={setRevealMode} disabled={examMode}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="instant">Chấm ngay sau mỗi câu</SelectItem>
            <SelectItem value="end">Chấm sau khi hoàn thành tất cả</SelectItem>
          </SelectContent>
        </Select>
        {examMode && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Chế độ thi thật luôn chấm sau khi hoàn thành tất cả, không xem được đáp án/kết quả từng câu khi đang làm.
          </p>
        )}
      </div>

      <Label className="font-normal text-muted-foreground items-start">
        <Checkbox className="mt-0.5" checked={lockPrevious} onCheckedChange={v => setLockPrevious(!!v)} />
        <span>Không cho xem/sửa lại câu đã trả lời</span>
      </Label>

      <div className="flex flex-col gap-2">
        <FieldLabel>Cách tính điểm</FieldLabel>
        <Select value={scoreMode} onValueChange={setScoreMode}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="count">Đếm số câu đúng</SelectItem>
            <SelectItem value="point">Tính theo thang điểm (point)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {scoreMode === 'point' && (
        <div className="flex flex-col gap-2">
          <FieldLabel>Point mặc định (khi file không set)</FieldLabel>
          <Select value={pointMode} onValueChange={setPointMode}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Mỗi câu 1 điểm</SelectItem>
              <SelectItem value="difficulty">Theo độ khó</SelectItem>
            </SelectContent>
          </Select>
          {pointMode === 'difficulty' && (
            <div className="flex flex-col gap-2.5">
              {['easy', 'medium', 'hard'].map(d => (
                <div key={d} className="flex items-center gap-3">
                  <Badge variant="secondary" className="w-16 justify-center shrink-0">{d}</Badge>
                  <Input type="number" min={0} value={customPoints[d]} className="w-20"
                    onChange={e => setCustomPoints(prev => ({ ...prev, [d]: Math.max(0, +e.target.value) }))} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <FieldLabel>Tỉ lệ đậu (pass)</FieldLabel>
        <div className="flex items-center gap-2.5">
          <Input type="number" min={1} max={100} value={passPct}
            onChange={e => setPassPct(Math.max(1, Math.min(100, +e.target.value)))} />
          <span className="text-xs text-muted-foreground shrink-0">%</span>
        </div>
      </div>

      <Button size="lg" className="w-full" onClick={onBuildQuiz}>
        {retryPool ? '▶ Bắt đầu làm lại' : hasQuestions ? '↺ Gen lại' : 'Bắt đầu'}
      </Button>
    </div>
  )
}
