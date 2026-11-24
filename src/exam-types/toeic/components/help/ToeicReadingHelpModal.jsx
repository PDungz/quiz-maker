import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ExplanationText } from '../../../../features/results'
import CopyBlock from './CopyBlock'
import { FIELDS, HL_TYPES, PASSAGE_FIELDS, FULL_GUIDE } from './toeicReadingGuide.content'

// Nội dung text dài (FULL_GUIDE) và các mảng data cho bảng sống ở toeicReadingGuide.content.js —
// file này chỉ lo UI (Dialog/Table/CopyBlock), sửa nội dung hướng dẫn thì mở file content, sửa
// giao diện thì mở file này.
export default function ToeicReadingHelpModal({ onClose }) {
  const [copied, setCopied] = useState(false)
  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(FULL_GUIDE)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = FULL_GUIDE
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex-row items-center justify-between pr-8 min-w-0">
          <DialogTitle>📄 Định dạng file đề TOEIC Reading</DialogTitle>
          <Button variant={copied ? 'default' : 'outline'} size="sm" onClick={copyAll}>
            {copied ? '✓ Đã copy toàn bộ' : '📋 Copy toàn bộ hướng dẫn'}
          </Button>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm text-muted-foreground min-w-0">
          <p className="bg-muted border-l-[3px] border-l-primary rounded-lg px-3.5 py-2.5">
            Đề TOEIC Reading (Part 5-7) gồm 2 loại block: <strong>đoạn văn</strong> (dùng chung cho
            Part 6-7) và <strong>câu hỏi</strong>. Bấm <strong>Copy toàn bộ hướng dẫn</strong> ở trên,
            điền phần "Part / Số lượng / Chủ đề" ở cuối rồi gửi cho AI.
          </p>

          <div className="border rounded-lg p-3.5 flex flex-col gap-1.5">
            <p className="font-semibold text-foreground">Số câu hỏi chuẩn theo từng Part</p>
            <p><strong>Part 5</strong> (101-130): mỗi câu độc lập, không có đoạn văn, không cần passage_id.</p>
            <p><strong>Part 6</strong> (131-146): 1 đoạn văn luôn đi kèm <strong>đúng 4 câu hỏi</strong> (các chỗ trống đánh số (1)(2)(3)(4) trong đoạn văn).</p>
            <p><strong>Part 7</strong> (147-200): 1 đoạn văn đi kèm <strong>từ 2 đến 4 câu hỏi</strong>, tuỳ độ dài đoạn văn.</p>
            <p>Toàn bộ câu hỏi cùng 1 đoạn văn phải dùng chung 1 <code>passage_id</code> — app nhóm chúng hiển thị thành 1 khối duy nhất cùng đoạn văn, không tách lẻ.</p>
          </div>

          <p className="bg-muted border rounded-lg px-3.5 py-2.5 text-xs">
            🎯 Gắn field <code>tags</code> cho câu hỏi Part 5-6 (vd <code>tags: [thi, chu-ngu-dong-tu]</code>)
            để dùng được ở tab <strong className="text-foreground">"Học"</strong> — lọc riêng theo chuyên đề
            ngữ pháp thay vì làm cả đề. Xem chi tiết cách dùng ở hướng dẫn riêng của tab Học.
          </p>

          <p>Block đoạn văn, dùng chung cho nhiều câu hỏi Part 6-7:</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trường</TableHead>
                <TableHead>Bắt buộc</TableHead>
                <TableHead>Mô tả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PASSAGE_FIELDS.map(([name, required, desc]) => (
                <TableRow key={name}>
                  <TableCell className="font-mono text-foreground">{name}</TableCell>
                  <TableCell>{required === 'Có' ? <strong>Có</strong> : required}</TableCell>
                  <TableCell>{desc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p>Block câu hỏi — các trường đặc thù TOEIC (còn lại giống Quiz thường):</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trường</TableHead>
                <TableHead>Bắt buộc</TableHead>
                <TableHead>Mô tả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FIELDS.map(([name, required, desc]) => (
                <TableRow key={name}>
                  <TableCell className="font-mono text-foreground">{name}</TableCell>
                  <TableCell>{required === 'Có' ? <strong>Có</strong> : required}</TableCell>
                  <TableCell>{desc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="border rounded-lg p-3.5 flex flex-col gap-1.5">
            <p className="font-semibold text-foreground">Chuẩn viết explanation — đủ 4 phần, đúng thứ tự</p>
            <p><strong>1. Dịch:</strong> dịch nghĩa tiếng Việt của câu (đã điền đáp án đúng).</p>
            <p><strong>2. Chọn X vì:</strong> lý do chọn, chỉ rõ dấu hiệu nhận biết bằng <code>{'<hl>'}</code>.</p>
            <p><strong>3. Các đáp án:</strong> liệt kê đủ 4 đáp án — nghĩa, loại từ (Part 5-6), lý do loại 3 đáp án sai.</p>
            <p><strong>4. Ghi nhớ:</strong> cấu trúc/collocation liên quan, kèm ví dụ tiếng Anh có dịch.</p>
            <p className="text-xs">Viết bằng <code>explanation: |</code> (dạng nhiều dòng), các phần cách nhau 1 dòng trống, không icon/emoji.</p>
          </div>

          <p>
            Đánh dấu dấu hiệu nhận biết ở phần "Chọn X vì" và "Ghi nhớ" bằng <code>{'<hl type="...">...</hl>'}</code>{' '}
            — giống sách luyện thi chữa bài bằng nhiều màu bút dạ quang, mỗi loại dấu hiệu 1 màu:
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>type</TableHead>
                <TableHead>Dùng cho</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HL_TYPES.map(([type, desc]) => (
                <TableRow key={type}>
                  <TableCell>
                    <ExplanationText text={`<hl type="${type}">${type}</hl>`} />
                  </TableCell>
                  <TableCell>{desc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="bg-muted border rounded-lg px-3.5 py-2.5">
            Ví dụ phần "Chọn X vì": Chọn B vì câu chưa có động từ chính, và <ExplanationText text='<hl type="time">last quarter</hl>' /> là dấu hiệu
            thời gian quá khứ, nên động từ phải chia <ExplanationText text='<hl type="grammar">quá khứ đơn</hl>' />.
          </p>

          <p>Toàn bộ nội dung sẽ được copy (bấm nút ở góc trên):</p>
          <CopyBlock text={FULL_GUIDE} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
