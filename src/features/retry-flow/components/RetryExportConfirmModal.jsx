import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function RetryExportConfirmModal({ onExportThenRetry, onRetryWithoutExport, onCancel }) {
  return (
    <Dialog open onOpenChange={open => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>📥 Chưa xuất kết quả</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Bạn chưa xuất file kết quả lần làm này. Sau khi làm lại, kết quả hiện tại vẫn xem lại được trong phiên này, nhưng sẽ mất nếu đóng tab hoặc xoá dữ liệu.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Hủy</Button>
          <Button variant="outline" onClick={onRetryWithoutExport}>Làm lại luôn</Button>
          <Button onClick={onExportThenRetry}>Xuất file rồi làm lại</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
