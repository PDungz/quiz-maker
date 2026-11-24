import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const TOPIC_TAGS = [
  ['thi', 'Thì động từ (hiện tại/quá khứ/tương lai đơn, tiếp diễn, hoàn thành...)'],
  ['chu-ngu-dong-tu', 'Hoà hợp chủ ngữ — động từ'],
  ['tu-loai', 'Từ loại (danh từ/động từ/tính từ/trạng từ)'],
  ['gioi-tu', 'Giới từ'],
  ['menh-de-quan-he', 'Mệnh đề quan hệ'],
  ['lien-tu', 'Liên từ / từ nối'],
  ['so-sanh', 'So sánh (hơn, nhất, bằng)'],
  ['bi-dong', 'Câu bị động'],
]

// Hướng dẫn riêng cho tab "Học" — khác hẳn trọng tâm với 2 hướng dẫn định dạng file đầy đủ của
// Làm đề (ToeicReadingHelpModal/ToeicListeningHelpModal). Ở đây không lặp lại toàn bộ cấu trúc
// đề thi, chỉ giải thích đúng 1 việc: "Học" là luyện riêng 1 phần nhỏ, lọc theo Part (phù hợp
// Listening) hoặc theo tags chuyên đề ngữ pháp (phù hợp Reading) — không yêu cầu đọc lại format
// toàn bộ file .md nếu chỉ muốn hiểu cách hoạt động của chế độ Học.
export default function ToeicTopicHelpModal({ onClose }) {
  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="min-w-0">
          <DialogTitle>🎯 Chế độ Học</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm text-muted-foreground min-w-0">
          <p className="bg-muted border-l-[3px] border-l-primary rounded-lg px-3.5 py-2.5">
            <strong className="text-foreground">Học</strong> khác <strong className="text-foreground">Làm đề</strong>:
            không làm nguyên cả đề theo cấu trúc thi thật, mà luyện riêng 1 phần nhỏ đang yếu —
            chọn lọc theo <strong>Part</strong> hoặc theo <strong>chuyên đề ngữ pháp</strong>.
          </p>

          <div className="border rounded-lg p-3.5 flex flex-col gap-1.5">
            <p className="font-semibold text-foreground">📑 Lọc theo Part — hợp với Listening</p>
            <p>
              Chỉ chọn đúng 1 hoặc vài Part muốn luyện riêng, vd chỉ Part 2 (hỏi đáp) để quen phản
              xạ nghe nhanh, hoặc chỉ Part 3-4 (hội thoại/bài nói) để luyện nghe đoạn dài. Không cần
              làm đủ cả 4 Part Listening hay 3 Part Reading cùng lúc như khi Làm đề.
            </p>
          </div>

          <div className="border rounded-lg p-3.5 flex flex-col gap-2">
            <p className="font-semibold text-foreground">🎯 Lọc theo chuyên đề — hợp với Reading</p>
            <p>
              Reading (đặc biệt Part 5-6) kiểm tra ngữ pháp trực tiếp, nên mỗi câu hỏi có thể gắn
              1 hoặc vài <code>tags</code> trong file .md — app tự liệt kê đúng những tag có trong
              đề đã nạp để chọn. Gợi ý các tag thường gặp (đặt tên khác cũng được):
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>tag</TableHead>
                  <TableHead>Chuyên đề</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TOPIC_TAGS.map(([tag, desc]) => (
                  <TableRow key={tag}>
                    <TableCell className="font-mono text-foreground">{tag}</TableCell>
                    <TableCell>{desc}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs">
              Ví dụ 1 câu trong .md: <code>tags: [thi, chu-ngu-dong-tu]</code>. Nếu đề chưa có câu
              nào gắn tags, chỉ dùng được cách lọc theo Part.
            </p>
          </div>

          <p>
            Chọn cách lọc ở mục <strong className="text-foreground">"Lọc theo"</strong> trong tab
            "Học" của sidebar, rồi tick các Part/chuyên đề muốn luyện và bấm Bắt đầu. Hình thức
            (xem đáp án ngay/thi thử) và timer vẫn hoạt động như Làm đề.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
