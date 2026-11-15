import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function ConfirmSubmitModal({ unansweredCount, onConfirm, onCancel }) {
  return (
    <Dialog open onOpenChange={open => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🏁 Xác nhận nộp bài</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground flex flex-col gap-2.5">
          <p>Bạn chắc chắn muốn nộp bài ngay bây giờ?</p>
          {unansweredCount > 0 && (
            <p className="px-3 py-2.5 bg-destructive/10 text-destructive rounded-lg text-sm">
              ⚠️ Còn {unansweredCount} câu chưa trả lời — các câu này sẽ được tính là bỏ qua.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Hủy</Button>
          <Button variant="destructive" onClick={onConfirm}>Xác nhận nộp bài</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
