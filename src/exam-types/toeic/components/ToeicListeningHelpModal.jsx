import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ExplanationText } from '../../../features/results'

const FIELDS = [
  ['part', 'Không', <>Part của câu hỏi: <code>1</code>, <code>2</code>, <code>3</code> hoặc <code>4</code></>],
  ['number', 'Bắt buộc', <>Số thứ tự câu hỏi thật trong đề, vd <code>1</code>-<code>100</code>. Dùng để hiển thị đúng số câu VÀ để khớp đúng file audio/ảnh thật</>],
  ['passage_id', 'Không', <>Gắn câu hỏi vào 1 nhóm audio dùng chung (bắt buộc với Part 3-4), vd <code>p3-1</code></>],
  ['question', 'Có', 'Nội dung câu hỏi'],
  ['options', 'Có', 'Các lựa chọn dạng key-value'],
  ['correct_answer', 'Có', <>Key đáp án đúng, vd <code>A</code></>],
  ['explanation', 'Không', <>Giải thích đáp án, dùng tag <code>&lt;hl type="..."&gt;</code> để đánh dấu dấu hiệu nhận biết</>],
]

const PASSAGE_FIELDS = [
  ['kind', 'Có', <>Luôn là <code>passage</code> để đánh dấu đây là 1 nhóm dùng chung, không phải câu hỏi</>],
  ['id', 'Có', <>Định danh nhóm, dùng để câu hỏi tham chiếu qua <code>passage_id</code>, vd <code>p3-1</code></>],
  ['media', 'Có', <>Luôn đặt <code>audio</code> — đánh dấu đây là nhóm audio dùng chung (Part 3-4), không phải đoạn văn text</>],
  ['title', 'Không', 'Tiêu đề audio, vd tên hội thoại/bài nói'],
]

const AUDIO_FILE_NAMING = [
  ['Part 1', 'q<number>.mp3', 'Mỗi câu có audio riêng, đặt theo đúng number của câu đó, vd q1.mp3'],
  ['Part 2', 'q<number>.mp3', 'Mỗi câu có audio riêng, đặt theo đúng number của câu đó, vd q7.mp3'],
  ['Part 3-4', 'q<number nhỏ nhất trong nhóm>.mp3', 'Cả nhóm 3 câu dùng chung 1 audio — chỉ cần đúng 1 file đặt theo number của câu ĐẦU nhóm, vd q71.mp3 dùng cho câu 71-73'],
]

const IMAGE_FILE_NAMING = [
  ['Part 1', 'q<number>.jpg/.jpeg/.png/.webp', 'Ảnh minh hoạ riêng cho từng câu, đặt theo đúng number, vd q1.jpg'],
]

function CopyBlock({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="relative w-full">
      <Button
        variant={copied ? 'default' : 'outline'}
        size="sm"
        className="absolute top-2 right-2"
        onClick={copy}
      >
        {copied ? '✓ Đã copy' : '📋 Copy'}
      </Button>
      <pre className="m-0 w-full max-h-[360px] overflow-y-auto whitespace-pre-wrap break-words bg-muted border rounded-lg p-3.5 font-mono text-xs"><code>{text}</code></pre>
    </div>
  )
}

const FULL_GUIDE = `# Quy tắc định dạng file đề TOEIC Listening (.md) — Quiz Maker

Tài liệu này mô tả định dạng file Markdown cho đề TOEIC Listening (Part 1-4).
Dùng để: (1) người đọc tự viết file tay, (2) làm prompt đưa cho AI generate bộ đề đúng chuẩn.

## Cấu trúc tổng quát

File gồm nhiều block, mỗi block nằm giữa hai dấu \`---\`. Có 2 loại block:
1. Block audio dùng chung (\`kind: passage\`, \`media: audio\`) — đặc trưng của Part 3-4.
2. Block câu hỏi — giống Quiz thường, có thêm \`part\`, \`number\` và \`passage_id\`.

File .md KHÔNG chứa file audio/ảnh thật — chỉ chứa text của đề. Audio/ảnh được nạp riêng bằng nút
"🎧 Thêm folder audio (Listening)" trong sidebar, app tự khớp theo tên file với field \`number\`
của câu hỏi.

## Số câu hỏi chuẩn theo từng Part (quan trọng)

- **Part 1** (number 1-6): mỗi câu độc lập, có 1 ẢNH + 1 audio riêng. KHÔNG cần passage_id.
- **Part 2** (number 7-31): mỗi câu độc lập, có 1 audio riêng (câu hỏi + 3 lựa chọn trả lời bằng lời nói). KHÔNG cần passage_id.
- **Part 3** (number 32-70): 1 audio hội thoại dùng chung cho ĐÚNG 3 câu hỏi. BẮT BUỘC passage_id, khai báo passage với \`media: audio\`.
- **Part 4** (number 71-100): 1 audio bài nói ngắn dùng chung cho ĐÚNG 3 câu hỏi. BẮT BUỘC passage_id, khai báo passage với \`media: audio\`.

Mỗi nhóm audio dùng chung khai báo 1 block \`kind: passage\` + \`media: audio\` riêng, và TẤT CẢ câu
hỏi thuộc nhóm đó phải cùng trỏ \`passage_id\` về đúng \`id\` của nó — app sẽ tự nhóm và hiển thị
chung 1 khối (audio + toàn bộ câu hỏi của nó), đúng như cách đề thi thật trình bày.

Mỗi câu hỏi PHẢI có field \`number\` đúng số thứ tự thật trong đề (chuẩn TOEIC: Part 1 = 1-6,
Part 2 = 7-31, Part 3 = 32-70, Part 4 = 71-100) — number dùng để hiển thị đúng số câu VÀ để khớp
đúng file audio/ảnh thật, nên không được bỏ trống.

## Audio & ảnh — nạp qua folder, không ghi trong .md

File .md chỉ chứa TEXT của đề — không chứa file audio/ảnh thật. Audio/ảnh thật nạp riêng qua nút
"🎧 Thêm folder audio (Listening)" ở sidebar: chọn 1 folder chứa toàn bộ file audio/ảnh, app tự
đọc tên file và khớp với \`number\` của từng câu. Không cần ghi đường dẫn file vào .md.

Quy ước đặt tên file BẮT BUỘC: \`q<number>.<đuôi file>\`, với \`<number>\` đúng bằng field \`number\`
của câu hỏi liên quan.

| Part | Tên file audio | Ghi chú |
|---|---|---|
| Part 1 | q<number>.mp3 | Mỗi câu 1 audio riêng, vd q1.mp3 |
| Part 2 | q<number>.mp3 | Mỗi câu 1 audio riêng, vd q7.mp3 |
| Part 3-4 | q<number nhỏ nhất trong nhóm>.mp3 | Cả nhóm 3 câu dùng chung 1 audio — chỉ cần 1 file đặt theo number câu ĐẦU nhóm, vd q71.mp3 dùng cho câu 71-73 |

Ảnh minh hoạ chỉ cần cho Part 1: \`q<number>.jpg\` (hoặc .jpeg/.png/.webp), vd q1.jpg.

Đuôi file audio hỗ trợ: mp3, m4a, wav, ogg. Mọi file trong folder không khớp đúng tên
\`q<number>.<đuôi>\` sẽ bị bỏ qua, không gây lỗi.

## Block audio dùng chung (passage, media: audio)

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| kind | Có | Luôn là \`passage\` |
| id | Có | Định danh nhóm, vd p3-1, p4-1 |
| media | Có | Luôn đặt \`audio\` |
| title | Không | Tiêu đề audio |

## Block câu hỏi

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| part | Không | Part của câu hỏi: 1, 2, 3 hoặc 4 |
| number | BẮT BUỘC | Số thứ tự câu hỏi THẬT trong đề (chuẩn TOEIC: Part 1 = 1-6, Part 2 = 7-31, Part 3 = 32-70, Part 4 = 71-100). Dùng để khớp đúng file audio/ảnh, KHÔNG được bỏ trống |
| passage_id | Không | Gắn vào nhóm audio đã khai báo ở trên — BẮT BUỘC với Part 3-4, để trống với Part 1-2 |
| question | Có | Nội dung câu hỏi |
| options | Có | Các lựa chọn dạng key: value |
| correct_answer | Có | Key đáp án đúng, vd A |
| explanation | Không | Giải thích đáp án, nên dùng tag \\<hl type="..."\\> để đánh dấu dấu hiệu nhận biết |

Các trường khác (id, category, difficulty, tags, point...) giống hệt Quiz thường.

## Ví dụ Part 1 (cần ảnh q1.jpg + audio q1.mp3, nạp riêng qua folder audio)

---
id: l1-001
part: 1
number: 1
question: Look at the picture and select the statement that best describes it.
options:
  A: A man is typing on a laptop.
  B: A man is reading a newspaper.
  C: A woman is watering plants.
  D: A woman is painting a wall.
correct_answer: A
---

## Ví dụ Part 2 (câu hỏi + đáp án bằng lời nói, chỉ cần audio q7.mp3)

---
id: l2-001
part: 2
number: 7
question: (Nghe audio) When does the meeting start?
options:
  A: At 9 A.M.
  B: In the conference room.
  C: Next Tuesday.
correct_answer: A
explanation: Câu hỏi "When" cần đáp án chỉ <hl type="time">thời điểm</hl>, nên A đúng.
---

## Ví dụ Part 3 (1 audio hội thoại dùng chung ĐÚNG 3 câu, chỉ cần audio q32.mp3)

---
kind: passage
id: p3-1
media: audio
title: Conversation about a delivery delay
---

---
id: l3-001
part: 3
number: 32
passage_id: p3-1
question: What is the woman calling about?
options:
  A: A late delivery
  B: A billing error
  C: A product return
  D: A job application
correct_answer: A
---

---
id: l3-002
part: 3
number: 33
passage_id: p3-1
question: What does the man offer to do?
options:
  A: Issue a refund
  B: Send a replacement
  C: Cancel the order
  D: Transfer the call
correct_answer: B
---

---
id: l3-003
part: 3
number: 34
passage_id: p3-1
question: What will the woman probably do next?
options:
  A: Visit the store
  B: Provide her address
  C: Call back later
  D: Request a manager
correct_answer: B
---

## Ví dụ Part 4 (1 audio bài nói dùng chung ĐÚNG 3 câu, chỉ cần audio q71.mp3)

---
kind: passage
id: p4-1
media: audio
title: Announcement about office renovation
---

---
id: l4-001
part: 4
number: 71
passage_id: p4-1
question: What is the announcement mainly about?
options:
  A: A new employee
  B: An office renovation
  C: A company holiday
  D: A client visit
correct_answer: B
---

---
id: l4-002
part: 4
number: 72
passage_id: p4-1
question: When will the renovation begin?
options:
  A: Next week
  B: Next month
  C: Tomorrow
  D: This weekend
correct_answer: A
---

---
id: l4-003
part: 4
number: 73
passage_id: p4-1
question: What are employees asked to do?
options:
  A: Work from home
  B: Attend a meeting
  C: Remove personal items from desks
  D: Submit a renovation request
correct_answer: C
---

## Quy tắc quan trọng

1. Khai báo block passage (media: audio) TRƯỚC các câu hỏi tham chiếu đến nó trong file.
2. Part 3-4: mỗi nhóm audio luôn đi kèm ĐÚNG 3 câu hỏi.
3. Toàn bộ câu hỏi của cùng 1 nhóm audio phải dùng cùng 1 passage_id — app nhóm và hiển thị chúng chung 1 khối duy nhất, không tách lẻ từng câu.
4. Part 1-2 không có passage_id (mỗi câu độc lập). Part 3-4 luôn phải có passage_id.
5. Luôn đánh số number cho từng câu hỏi theo đúng chuẩn TOEIC: Part 1 = 1-6, Part 2 = 7-31, Part 3 = 32-70, Part 4 = 71-100 — number dùng để khớp đúng file audio/ảnh, không được bỏ trống.
6. File audio/ảnh thật đặt tên q<number>.<đuôi file> trong 1 folder, nạp qua nút "🎧 Thêm folder audio (Listening)" — không ghi đường dẫn file vào .md.
7. Trong explanation, bọc đúng cụm từ là dấu hiệu nhận biết bằng <hl type="...">...</hl> nếu có.
8. Không thêm text nào ngoài các block --- ... ---.

---
# YÊU CẦU (điền vào phần dưới rồi gửi cho AI để generate bộ đề)

Part muốn tạo: <1 / 2 / 3 / 4 / mix>
Số lượng câu hỏi: <điền số lượng>
Chủ đề hội thoại/bài nói (nếu Part 3-4): <vd: gọi điện công ty, thông báo nội bộ, quảng cáo>
Ghi chú thêm: <vd: độ khó, tránh trùng chủ đề đã có>`

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
