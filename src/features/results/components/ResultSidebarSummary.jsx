import { formatDuration } from '../../../utils/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// Khối tóm tắt kết quả trong sidebar: %, đúng/sai/bỏ qua, thời gian làm bài, nút làm lại câu đã chọn.
// Dùng chung bởi App.jsx (sidebar chính) và ResultsPage.jsx (sidebar của trang kết quả đã lưu).
export default function ResultSidebarSummary({
  pct, passed, passPct, scoreMode, earnedPoint, maxPoint,
  totalCorrect, totalWrong, totalSkipped,
  elapsedSeconds, timerEnabled, timerMinutes, startedAt,
  retrySelectionSize, onRetrySelected,
  children,
}) {
  return (
    <>
      <Separator className="mt-2" />
      <Card>
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <div className={`text-3xl font-extrabold ${passed ? 'text-success' : 'text-destructive'}`}>{pct}%</div>
          <Badge variant={passed ? 'default' : 'destructive'} className={passed ? 'bg-success text-success-foreground' : ''}>
            {passed ? '✓ Đạt' : '✗ Không đạt'} (ngưỡng {passPct}%)
          </Badge>
          {scoreMode === 'point' && (
            <div className="text-xs text-muted-foreground">{earnedPoint} / {maxPoint} điểm</div>
          )}
          <div className="text-sm text-muted-foreground">
            <span className="text-success">{totalCorrect} đúng</span>
            {' · '}
            <span className="text-destructive">{totalWrong} sai</span>
            {' · '}
            <span>{totalSkipped} bỏ qua</span>
          </div>
          {elapsedSeconds != null && (
            <div className="text-sm text-muted-foreground">
              ⏱ Làm trong {formatDuration(elapsedSeconds)}
              {timerEnabled && ` (${Math.ceil(elapsedSeconds / 60)}/${timerMinutes} phút)`}
              {startedAt && (
                <div>
                  {new Date(startedAt).toLocaleTimeString('vi-VN')} — {new Date(startedAt + elapsedSeconds * 1000).toLocaleTimeString('vi-VN')}
                </div>
              )}
            </div>
          )}
          {retrySelectionSize > 0 && (
            <Button className="w-full" onClick={onRetrySelected}>
              🔁 Làm lại {retrySelectionSize} câu đã chọn
            </Button>
          )}
          {children}
        </CardContent>
      </Card>
    </>
  )
}
