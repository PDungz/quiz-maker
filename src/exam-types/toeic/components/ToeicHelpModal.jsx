import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ExplanationText } from '../../../features/results'

const FIELDS = [
  ['part', 'Không', <>Part của câu hỏi: <code>5</code>, <code>6</code> hoặc <code>7</code></>],
  ['number', 'Khuyến nghị', <>Số thứ tự câu hỏi thật trong đề, vd <code>101</code>-<code>200</code>. App hiển thị đúng số này thay vì tự đếm, vì tự đếm sẽ sai khi lọc theo Part</>],
  ['passage_id', 'Không', <>Gắn câu hỏi vào 1 đoạn văn dùng chung (bắt buộc với Part 6-7), vd <code>p1</code></>],
  ['question', 'Có', 'Nội dung câu hỏi'],
  ['options', 'Có', 'Các lựa chọn dạng key-value'],
  ['correct_answer', 'Có', <>Key đáp án đúng, vd <code>A</code></>],
  ['explanation', 'Không', <>Giải thích đáp án, dùng tag <code>&lt;hl type="..."&gt;</code> để đánh dấu dấu hiệu nhận biết</>],
]

const HL_TYPES = [
  ['grammar', 'Dấu hiệu ngữ pháp (thì, cấu trúc, loại từ cần điền)'],
  ['time', 'Dấu hiệu thời gian (last week, by the time, since...)'],
  ['collocation', 'Collocation / đi kèm cố định (increase in, responsible for...)'],
  ['connector', 'Từ nối / liên từ (however, therefore, in addition...)'],
  ['vocab', 'Từ vựng/thành ngữ cần chú ý nghĩa'],
]

const PASSAGE_FIELDS = [
  ['kind', 'Có', <>Luôn là <code>passage</code> để đánh dấu đây là đoạn văn, không phải câu hỏi</>],
  ['id', 'Có', <>Định danh đoạn văn, dùng để câu hỏi tham chiếu qua <code>passage_id</code>, vd <code>p1</code></>],
  ['media', 'Không', <>Đặt <code>audio</code> để đánh dấu đây là nhóm audio dùng chung (Listening Part 3-4), thay cho đoạn văn text. Để trống với Part 6-7</>],
  ['title', 'Không', 'Tiêu đề đoạn văn/audio, vd tên email/hội thoại'],
  ['content', 'Có với đoạn văn, bỏ trống với audio', <>Nội dung đoạn văn, dùng <code>|</code> để giữ format xuống dòng</>],
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

const FULL_GUIDE = `# Quy tắc định dạng file đề TOEIC (.md) — Quiz Maker

Tài liệu này mô tả định dạng file Markdown cho đề TOEIC Reading (Part 5-7) và Listening (Part 1-4).
Dùng để: (1) người đọc tự viết file tay, (2) làm prompt đưa cho AI generate bộ đề đúng chuẩn.

## Cấu trúc tổng quát

File gồm nhiều block, mỗi block nằm giữa hai dấu \`---\`. Có 2 loại block:
1. Block đoạn văn/audio (\`kind: passage\`) — dùng chung cho nhiều câu hỏi, đặc trưng của Part 3-4 và 6-7.
2. Block câu hỏi — giống Quiz thường, có thêm \`part\`, \`number\` và \`passage_id\`.

File .md KHÔNG chứa file audio/ảnh thật — chỉ chứa text của đề. Audio/ảnh được nạp riêng bằng nút
"🎧 Thêm folder audio (Listening)" trong sidebar, app tự khớp theo tên file với field \`number\`
của câu hỏi (xem phần "Audio & ảnh cho Listening" dưới đây).

## Số câu hỏi chuẩn theo từng Part (quan trọng)

**Listening:**
- **Part 1** (number 1-6): mỗi câu độc lập, có 1 ẢNH + 1 audio riêng. KHÔNG cần passage_id.
- **Part 2** (number 7-31): mỗi câu độc lập, có 1 audio riêng (câu hỏi + 3 lựa chọn trả lời bằng lời nói). KHÔNG cần passage_id.
- **Part 3** (number 32-70): 1 audio hội thoại dùng chung cho ĐÚNG 3 câu hỏi. BẮT BUỘC passage_id, khai báo passage với \`media: audio\`.
- **Part 4** (number 71-100): 1 audio bài nói ngắn dùng chung cho ĐÚNG 3 câu hỏi. BẮT BUỘC passage_id, khai báo passage với \`media: audio\`.

**Reading:**
- **Part 5** (number 101-130): mỗi câu độc lập, KHÔNG có đoạn văn, KHÔNG cần passage_id.
- **Part 6** (number 131-146): 1 đoạn văn (thường là email/thông báo ngắn) luôn đi kèm ĐÚNG 4 câu hỏi
  (thường có các chỗ trống đánh số (1) (2) (3) (4) ngay trong đoạn văn).
- **Part 7** (number 147-200): 1 đoạn văn (thông báo, email, quảng cáo, bài báo...) đi kèm TỪ 2 ĐẾN 4 câu hỏi,
  tuỳ độ dài đoạn văn (đoạn ngắn ~2 câu, đoạn dài ~4 câu).

Mỗi đoạn văn/audio dùng chung khai báo 1 block \`kind: passage\` riêng, và TẤT CẢ câu hỏi thuộc
nhóm đó phải cùng trỏ \`passage_id\` về đúng \`id\` của nó — app sẽ tự nhóm và hiển thị chung 1 khối
(đoạn văn/audio + toàn bộ câu hỏi của nó), đúng như cách đề thi thật trình bày.

Mỗi câu hỏi PHẢI có field \`number\` đúng số thứ tự thật trong đề (chuẩn TOEIC đầy đủ: Part 1 =
1-6, Part 2 = 7-31, Part 3 = 32-70, Part 4 = 71-100, Part 5 = 101-130, Part 6 = 131-146, Part 7 =
147-200) — app hiển thị đúng số này, và dùng number để khớp đúng file audio/ảnh thật.

## Audio & ảnh cho Listening (Part 1-4)

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

## Block đoạn văn (passage)

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| kind | Có | Luôn là \`passage\` |
| id | Có | Định danh đoạn văn, vd p6-1, p7-1 |
| title | Không | Tiêu đề đoạn văn |
| content | Có | Nội dung đoạn văn, dùng \\| để giữ format. Với Part 6, đánh số các chỗ trống bằng (1) (2) (3) (4) ngay trong nội dung |

## Block câu hỏi

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| part | Không | Part của câu hỏi: 5, 6 hoặc 7 |
| number | Khuyến nghị | Số thứ tự câu hỏi THẬT trong đề (chuẩn TOEIC: Part 5 = 101-130, Part 6 = 131-146, Part 7 = 147-200). App hiển thị đúng số này — KHÔNG tự đếm theo vị trí trong file, vì vị trí sẽ sai lệch khi lọc theo Part |
| passage_id | Không | Gắn vào đoạn văn đã khai báo ở trên — BẮT BUỘC với Part 6-7, để trống với Part 5 |
| question | Có | Nội dung câu hỏi |
| options | Có | Các lựa chọn dạng key: value |
| correct_answer | Có | Key đáp án đúng, vd A |
| explanation | Không | Giải thích đáp án, nên dùng tag \\<hl type="..."\\> để đánh dấu dấu hiệu nhận biết |

Các trường khác (id, category, difficulty, tags, point...) giống hệt Quiz thường.

## Đánh dấu dấu hiệu nhận biết trong explanation (quan trọng, giống sách chữa bài)

Khi viết \`explanation\`, bọc đúng cụm từ là "dấu hiệu nhận biết" bằng tag \`<hl type="...">...</hl>\`
để app highlight bằng màu riêng cho từng loại — giống cách sách luyện thi dùng nhiều màu bút dạ
quang khi chữa bài. KHÔNG bọc cả câu, chỉ bọc đúng cụm từ là dấu hiệu.

Các type hợp lệ:

| type | Dùng cho |
|---|---|
| grammar | Dấu hiệu ngữ pháp (thì, cấu trúc, loại từ cần điền) |
| time | Dấu hiệu thời gian (last week, by the time, since...) |
| collocation | Collocation / đi kèm cố định (increase in, responsible for...) |
| connector | Từ nối / liên từ (however, therefore, in addition...) |
| vocab | Từ vựng/thành ngữ cần chú ý nghĩa |

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

## Ví dụ Part 5 (không cần passage_id)

---
id: t5-001
part: 5
number: 101
question: The company ----- its profits significantly last quarter.
options:
  A: increase
  B: increased
  C: increasing
  D: to increase
correct_answer: B
explanation: Đáp án B đúng vì <hl type="time">last quarter</hl> là dấu hiệu thời gian quá khứ, nên động từ phải chia <hl type="grammar">quá khứ đơn</hl>.
---

## Ví dụ Part 6 (1 đoạn văn + ĐÚNG 4 câu hỏi theo 4 chỗ trống (1)(2)(3)(4))

---
kind: passage
id: p6-1
title: New Visitor Check-In System
content: |
  To: All Employees
  From: Security Office

  Beginning on 1 December, all visitors will check in (1) ----- a self-service kiosk. Visitors must wear the badge (2) ----- at all times. (3) -----. Please return all badges when visitors (4) -----.
---

---
id: t6-001
part: 6
number: 131
passage_id: p6-1
question: Which choice best completes blank (1)?
options:
  A: use
  B: used
  C: using
  D: uses
correct_answer: C
explanation: Trước chỗ trống đã có mệnh đề đầy đủ, nên cần phân từ <hl type="grammar">V-ing</hl> để chỉ cách thức.
---

---
id: t6-002
part: 6
number: 132
passage_id: p6-1
question: Which choice best completes blank (2)?
options:
  A: visibly
  B: visible
  C: visibility
  D: visibilities
correct_answer: A
explanation: "wear the badge" đã đủ nghĩa, nên cần <hl type="grammar">trạng từ</hl> bổ nghĩa cách thức.
---

---
id: t6-003
part: 6
number: 133
passage_id: p6-1
question: Which choice best completes blank (3)?
options:
  A: The cafeteria will extend its lunch hours next month.
  B: Parking permits can be renewed through the intranet.
  C: The building was constructed more than twenty years ago.
  D: Anyone without a badge will be asked to return to the front desk.
correct_answer: D
explanation: Câu trước nói về quy định đeo thẻ, nên câu tiếp theo cần nói về <hl type="vocab">hệ quả nếu không có thẻ</hl>.
---

---
id: t6-004
part: 6
number: 134
passage_id: p6-1
question: Which choice best completes blank (4)?
options:
  A: departure
  B: depart
  C: departing
  D: departed
correct_answer: B
explanation: Mệnh đề thời gian bắt đầu bằng <hl type="connector">when</hl> dùng <hl type="grammar">hiện tại đơn</hl> thay cho tương lai.
---

## Ví dụ Part 7 (1 đoạn văn + 2-4 câu hỏi, ở đây 3 câu)

---
kind: passage
id: p7-1
title: Training Session Rescheduled
content: |
  Hi Marcus,

  The training originally planned for Thursday has been moved to Monday, because the trainer has to attend a conference. Please bring your laptop. If you cannot attend, let me know by Friday.

  Dana Okafor
---

---
id: t7-001
part: 7
number: 147
passage_id: p7-1
question: Why was the training rescheduled?
options:
  A: The trainer will be away at a conference.
  B: The meeting room was unavailable.
  C: The ticketing system was not ready.
  D: Too few employees had signed up.
correct_answer: A
explanation: Đoạn văn ghi rõ lý do <hl type="vocab">attend a conference</hl>, nên đáp án là A.
---

---
id: t7-002
part: 7
number: 148
passage_id: p7-1
question: What are attendees asked to bring?
options:
  A: A printed handbook
  B: A packed lunch
  C: A laptop
  D: A signed form
correct_answer: C
explanation: Email yêu cầu <hl type="vocab">bring your laptop</hl>, nên đáp án là C.
---

---
id: t7-003
part: 7
number: 149
passage_id: p7-1
question: What should Marcus do if he cannot attend?
options:
  A: Cancel the training for everyone
  B: Let Dana know by Friday
  C: Ask a colleague to attend instead
  D: Reschedule to December
correct_answer: B
explanation: Đoạn văn ghi rõ <hl type="time">let me know by Friday</hl>, nên đáp án là B.
---

## Quy tắc quan trọng

1. Khai báo block passage TRƯỚC các câu hỏi tham chiếu đến nó trong file.
2. Part 3-4: mỗi nhóm audio luôn đi kèm ĐÚNG 3 câu hỏi. Part 6: ĐÚNG 4 câu hỏi. Part 7: TỪ 2 ĐẾN 4 câu hỏi.
3. Toàn bộ câu hỏi của cùng 1 đoạn văn/audio phải dùng cùng 1 passage_id — app nhóm và hiển thị chúng chung 1 khối duy nhất, không tách lẻ từng câu.
4. Part 1-2 và Part 5 không có passage_id (mỗi câu độc lập). Part 3-4 và Part 6-7 luôn phải có passage_id.
5. Part 3-4 khai báo passage với \`media: audio\` (không cần content). Part 6-7 khai báo passage bình thường với content là đoạn văn.
6. Luôn đánh số number cho từng câu hỏi theo đúng chuẩn TOEIC đầy đủ: Part 1 = 1-6, Part 2 = 7-31, Part 3 = 32-70, Part 4 = 71-100, Part 5 = 101-130, Part 6 = 131-146, Part 7 = 147-200 — không để app tự đếm, vì số hiển thị sẽ sai khi lọc theo Part, và number còn dùng để khớp đúng file audio/ảnh.
7. File audio/ảnh thật đặt tên \`q<number>.<đuôi file>\` trong 1 folder, nạp qua nút "🎧 Thêm folder audio (Listening)" — không ghi đường dẫn file vào .md.
8. Trong explanation, bọc đúng cụm từ là dấu hiệu nhận biết bằng <hl type="...">...</hl>, chọn type phù hợp nhất trong bảng trên.
9. Không thêm text nào ngoài các block --- ... ---.

---
# YÊU CẦU (điền vào phần dưới rồi gửi cho AI để generate bộ đề)

Part muốn tạo: <1 / 2 / 3 / 4 / 5 / 6 / 7 / mix>
Số lượng câu hỏi: <điền số lượng>
Chủ đề đoạn văn (nếu Part 6-7): <vd: email công việc, thông báo nội bộ, quảng cáo>
Ghi chú thêm: <vd: độ khó, tránh trùng chủ đề đã có>`

export default function ToeicHelpModal({ onClose }) {
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
          <DialogTitle>📄 Định dạng file đề TOEIC</DialogTitle>
          <Button variant={copied ? 'default' : 'outline'} size="sm" onClick={copyAll}>
            {copied ? '✓ Đã copy toàn bộ' : '📋 Copy toàn bộ hướng dẫn'}
          </Button>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm text-muted-foreground min-w-0">
          <p className="bg-muted border-l-[3px] border-l-primary rounded-lg px-3.5 py-2.5">
            Đề TOEIC gồm 2 loại block: <strong>đoạn văn/audio</strong> (dùng chung cho Part 3-4 và 6-7) và{' '}
            <strong>câu hỏi</strong>. Bấm <strong>Copy toàn bộ hướng dẫn</strong> ở trên, điền phần
            "Part / Số lượng / Chủ đề" ở cuối rồi gửi cho AI.
          </p>

          <div className="border rounded-lg p-3.5 flex flex-col gap-1.5">
            <p className="font-semibold text-foreground">Số câu hỏi chuẩn theo từng Part</p>
            <p><strong>Part 1</strong> (1-6): mỗi câu độc lập, có 1 ảnh + 1 audio riêng.</p>
            <p><strong>Part 2</strong> (7-31): mỗi câu độc lập, có 1 audio riêng.</p>
            <p><strong>Part 3</strong> (32-70): 1 audio hội thoại dùng chung <strong>đúng 3 câu hỏi</strong>.</p>
            <p><strong>Part 4</strong> (71-100): 1 audio bài nói dùng chung <strong>đúng 3 câu hỏi</strong>.</p>
            <p><strong>Part 5</strong> (101-130): mỗi câu độc lập, không có đoạn văn.</p>
            <p><strong>Part 6</strong> (131-146): 1 đoạn văn luôn đi kèm <strong>đúng 4 câu hỏi</strong> (các chỗ trống đánh số (1)(2)(3)(4) trong đoạn văn).</p>
            <p><strong>Part 7</strong> (147-200): 1 đoạn văn đi kèm <strong>từ 2 đến 4 câu hỏi</strong>, tuỳ độ dài đoạn văn.</p>
            <p>Toàn bộ câu hỏi cùng 1 đoạn văn/audio phải dùng chung 1 <code>passage_id</code> — app nhóm chúng hiển thị thành 1 khối duy nhất, không tách lẻ.</p>
          </div>

          <div className="border rounded-lg p-3.5 flex flex-col gap-2">
            <p className="font-semibold text-foreground">🎧 Audio & ảnh cho Listening (Part 1-4)</p>
            <p>
              File .md chỉ chứa text đề — không chứa file audio/ảnh thật. Nạp audio/ảnh riêng qua nút{' '}
              <strong>"🎧 Thêm folder audio (Listening)"</strong> ở sidebar: chọn 1 folder chứa toàn bộ
              file, app tự đọc tên file và khớp với field <code>number</code> của câu hỏi.
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

          <p>Block đoạn văn/audio, dùng chung cho nhiều câu hỏi Part 3-4 và 6-7:</p>
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

          <p>
            Đánh dấu dấu hiệu nhận biết trong <code>explanation</code> bằng <code>{'<hl type="...">...</hl>'}</code>{' '}
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
            Ví dụ: Đáp án B đúng vì <ExplanationText text='<hl type="time">last quarter</hl>' /> là dấu hiệu
            thời gian quá khứ, nên động từ phải chia <ExplanationText text='<hl type="grammar">quá khứ đơn</hl>' />.
          </p>

          <p>Toàn bộ nội dung sẽ được copy (bấm nút ở góc trên):</p>
          <CopyBlock text={FULL_GUIDE} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
