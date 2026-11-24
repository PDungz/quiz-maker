import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ExplanationText } from '../../../../features/results'
import CopyBlock from './CopyBlock'
import {
  FIELDS, PASSAGE_FIELDS, AUDIO_FILE_NAMING, IMAGE_FILE_NAMING,
  PART1_IMAGE_PROMPT, FULL_GUIDE, ASSET_GENERATION_GUIDE,
} from './toeicListeningGuide.content'

// Nội dung text dài (FULL_GUIDE, ASSET_GENERATION_GUIDE) và các mảng data cho bảng sống ở
// toeicListeningGuide.content.js — file này chỉ lo UI (Dialog/Table/CopyBlock), sửa nội dung
// hướng dẫn thì mở file content, sửa giao diện thì mở file này.
export default function ToeicListeningHelpModal({ onClose }) {
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
          <DialogTitle>🎧 Định dạng file đề TOEIC Listening</DialogTitle>
          <Button variant={copied ? 'default' : 'outline'} size="sm" onClick={copyAll}>
            {copied ? '✓ Đã copy toàn bộ' : '📋 Copy toàn bộ hướng dẫn'}
          </Button>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm text-muted-foreground min-w-0">
          <p className="bg-muted border-l-[3px] border-l-primary rounded-lg px-3.5 py-2.5">
            Đề TOEIC Listening (Part 1-4) gồm 2 loại block: <strong>audio dùng chung</strong>
            (Part 3-4) và <strong>câu hỏi</strong>. File .md không chứa file audio/ảnh thật — nạp
            riêng qua nút "🎧 Thêm folder audio" ở sidebar.
          </p>

          <div className="border rounded-lg p-3.5 flex flex-col gap-1.5">
            <p className="font-semibold text-foreground">Số câu hỏi chuẩn theo từng Part</p>
            <p><strong>Part 1</strong> (1-6): mỗi câu độc lập, có 1 ảnh + 1 audio riêng.</p>
            <p><strong>Part 2</strong> (7-31): mỗi câu độc lập, có 1 audio riêng.</p>
            <p><strong>Part 3</strong> (32-70): 1 audio hội thoại dùng chung <strong>đúng 3 câu hỏi</strong>.</p>
            <p><strong>Part 4</strong> (71-100): 1 audio bài nói dùng chung <strong>đúng 3 câu hỏi</strong>.</p>
            <p>Toàn bộ câu hỏi cùng 1 nhóm audio phải dùng chung 1 <code>passage_id</code> — app nhóm chúng hiển thị thành 1 khối duy nhất, không tách lẻ.</p>
          </div>

          <div className="border rounded-lg p-3.5 flex flex-col gap-2">
            <p className="font-semibold text-foreground">🎧 Nạp audio & ảnh</p>
            <p>
              Bấm <strong>"🎧 Thêm folder audio (Listening)"</strong> ở sidebar, chọn 1 folder chứa
              toàn bộ file audio/ảnh — app tự đọc tên file và khớp với field <code>number</code> của
              câu hỏi. Không cần ghi đường dẫn file vào .md.
            </p>
            <p>Quy ước đặt tên file bắt buộc: <code>q&lt;number&gt;.&lt;đuôi file&gt;</code></p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>Tên file audio</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {AUDIO_FILE_NAMING.map(([part, name, note]) => (
                  <TableRow key={part}>
                    <TableCell className="font-mono text-foreground">{part}</TableCell>
                    <TableCell className="font-mono">{name}</TableCell>
                    <TableCell>{note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>Tên file ảnh</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {IMAGE_FILE_NAMING.map(([part, name, note]) => (
                  <TableRow key={part}>
                    <TableCell className="font-mono text-foreground">{part}</TableCell>
                    <TableCell className="font-mono">{name}</TableCell>
                    <TableCell>{note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs">Đuôi audio hỗ trợ: mp3, m4a, wav, ogg. File không khớp tên sẽ bị bỏ qua, không gây lỗi.</p>
          </div>

          <div className="border rounded-lg p-3.5 flex flex-col gap-2">
            <p className="font-semibold text-foreground">📁 Cấu trúc thư mục khuyến nghị</p>
            <p>
              App chỉ đọc theo <strong className="text-foreground">tên file</strong>, không quan tâm file nằm
              thư mục con nào — có thể tách audio/ảnh ra các thư mục con cho gọn, riêng thư mục tên đúng
              <code>audio-low</code> có ý nghĩa đặc biệt (xem mục "Đọc chậm" dưới). Khi bấm nạp, chọn đúng
              thư mục GỐC (vd <code>toeic-listening</code>), không chọn riêng <code>audio/</code> hoặc <code>image/</code>.
            </p>
            <pre className="m-0 bg-muted border rounded-lg p-3 font-mono text-xs overflow-x-auto">{`toeic-listening/
├── audio/
│   ├── q1.mp3
│   ├── q7.mp3
│   └── q32.mp3   (dùng chung Part 3 câu 32-34)
├── audio-low/     (không bắt buộc — bản đọc chậm, cùng tên file với audio/)
│   └── q1.mp3
└── image/
    ├── q1.jpg
    ├── q2.jpg
    └── q3.jpg`}</pre>
            <p className="text-xs">Chỉ Part 1 cần ảnh. Sau khi nạp, panel bên trái sẽ hiện số audio/audio chậm/ảnh đã khớp và liệt kê file nào bị bỏ qua (không khớp tên) để dễ soát lại.</p>
          </div>

          <div className="border rounded-lg p-3.5 flex flex-col gap-2">
            <p className="font-semibold text-foreground">🖼 Tạo ảnh Part 1 bằng AI (nếu chưa có ảnh thật)</p>
            <p>
              Mỗi câu Part 1 cần đúng 1 ảnh mô tả 1 hành động/tình huống khớp với đáp án đúng. Ảnh đề
              TOEIC thật luôn là <strong className="text-foreground">ảnh đen trắng</strong> — nhớ ghi rõ
              trong prompt, đừng để AI tạo ảnh màu rồi dễ bị nhầm với ảnh minh hoạ thường. Prompt mẫu cho từng câu:
            </p>
            <CopyBlock text={PART1_IMAGE_PROMPT} />
            <p className="text-xs">Tạo xong, đặt tên ảnh đúng theo <code>number</code> của câu (vd number: 1 → q1.jpg) rồi bỏ vào thư mục image/.</p>
          </div>

          <div className="border rounded-lg p-3.5 flex flex-col gap-2">
            <p className="font-semibold text-foreground">🤖 Nhờ AI tự tạo audio + ảnh cho cả đề (nâng cao)</p>
            <p>
              Nếu đang nhờ 1 AI khác (vd 1 phiên Claude riêng, có quyền chạy lệnh/code) tự generate
              toàn bộ audio đọc đề và ảnh Part 1 thay vì tự làm tay, bấm{' '}
              <strong className="text-foreground">Copy</strong> bên dưới và gửi nguyên văn cho AI đó
              — đây là playbook đã chạy thành công (cách cài TTS, cách ghép audio từng Part, cách vẽ
              ảnh đen trắng bằng code, cách đóng gói zip theo đúng cấu trúc thư mục ở trên), giúp AI
              làm đúng ngay lần đầu, không phải dò lại từ đầu hoặc đi sai hướng đã thất bại.
            </p>
            <CopyBlock text={ASSET_GENERATION_GUIDE} />
          </div>

          <div className="bg-muted border rounded-lg px-3.5 py-2.5 text-xs">
            🎤 Thêm field <code>transcript</code> (multiline, <code>transcript: |</code>) cho câu hỏi để
            dùng được chế độ <strong className="text-foreground">"Nghe &amp; gõ lại"</strong> ở tab Học —
            mô phỏng nghe 2 lần: <strong className="text-foreground">Bước 1</strong> nghe lần đầu rồi chọn
            đáp án A/B/C/D như bình thường, kiểm tra chỉ báo đúng/sai (không lộ text); <strong className="text-foreground">Bước 2</strong> nghe
            lại rồi gõ lại nguyên văn, MỖI DÒNG trong transcript là MỘT câu audio đọc riêng nên có 1 ô nhập
            riêng (Part 1: 4 ô A-D, Part 2: 4 ô gồm câu hỏi + 3 đáp án) — xong cả 2 bước mới hiện giải thích.
            Câu thiếu transcript vẫn luôn chọn đáp án như bình thường.
          </div>

          <div className="bg-muted border rounded-lg px-3.5 py-2.5 text-xs">
            🐢 Muốn nghe chậm hơn cho câu khó, thêm audio đọc chậm vào thư mục <code>audio-low</code>
            (cùng tên file với bản gốc trong <code>audio</code>, xem mục "Cấu trúc thư mục" ở trên) —
            app hiện checkbox "So sánh" khi có đủ 2 bản — tick để nghe cả 2 cùng lúc.
            Đây PHẢI là 1 file audio đọc chậm thật, không phải chỉnh tốc độ phát của bản gốc.
            Nếu audio là do AI tự tạo (TTS, xem mục "Nhờ AI tự tạo audio" ở trên) và khi nghe kỹ thấy
            transcript ghi KHÔNG khớp với thực tế đọc ra — có thể do TTS đọc sai/nuốt một từ nào đó —
            hãy sửa lại transcript cho đúng với audio thật đang có (transcript phải mô tả đúng cái tai
            nghe được), không sửa ngược lại audio.
          </div>

          <p>Block audio dùng chung (passage, media: audio), đặc trưng Part 3-4:</p>
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

          <p>Block câu hỏi — các trường đặc thù TOEIC Listening (còn lại giống Quiz thường):</p>
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

          <p className="bg-muted border rounded-lg px-3.5 py-2.5">
            Ví dụ highlight đáp án: <ExplanationText text='<hl type="time">last quarter</hl>' /> là dấu hiệu
            thời gian, nên chọn đáp án phù hợp.
          </p>

          <p>Toàn bộ nội dung sẽ được copy (bấm nút ở góc trên):</p>
          <CopyBlock text={FULL_GUIDE} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
