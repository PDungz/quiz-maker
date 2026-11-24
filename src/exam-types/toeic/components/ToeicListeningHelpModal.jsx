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
  ['transcript', 'Khuyến nghị', <>Nguyên văn lời đọc trong audio, multiline — mỗi dòng 1 câu audio đọc riêng. Dùng cho chế độ "Nghe &amp; gõ lại" ở tab Học — không bắt buộc, nhưng thiếu thì câu đó sẽ tự rơi về chế độ chọn đáp án</>],
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

## Field transcript cho chế độ "Nghe & gõ lại"

Ghi thêm field \`transcript\` (nguyên văn lời đọc trong audio của câu đó) để dùng được chế độ
"Nghe & gõ lại" ở tab Học — người học nghe audio rồi gõ lại câu, app tự chấm gần đúng so với
\`transcript\` (không phân biệt hoa/thường, dấu câu, khoảng trắng dư). Chế độ này chỉ bật được cho
câu có \`transcript\`; câu thiếu field này vẫn luôn hoạt động bình thường ở chế độ chọn đáp án.

\`transcript\` là multiline (\`transcript: |\`), MỖI DÒNG ứng với ĐÚNG MỘT câu mà audio đọc ra —
app sẽ hiện 1 ô nhập riêng cho mỗi dòng, để người học gõ lại từng câu thay vì gộp cả đoạn vào 1 ô:
- Part 1: audio đọc 4 câu mô tả tranh (không đọc A/B/C/D) → ghi ĐỦ 4 dòng, mỗi dòng 1 câu mô tả,
  đúng thứ tự A, B, C, D (xem ví dụ Part 1 bên dưới).
- Part 2: audio đọc câu hỏi rồi đến từng đáp án → ghi dòng đầu là câu hỏi, các dòng sau là từng
  đáp án (3 dòng, theo thứ tự A, B, C) — tổng 4 dòng (xem ví dụ Part 2 bên dưới).
- Part 3-4: giữ nhãn \`Woman:\`/\`Man:\` đầu mỗi dòng như ví dụ Part 3 — app tự bỏ nhãn này khi
  chấm, mỗi lượt thoại là 1 ô nhập. Chỉ cần ghi transcript ở câu đầu nhóm (3 câu dùng chung 1
  audio); 2 câu sau trong nhóm có thể để trống transcript nếu không cần luyện nghe chép riêng.

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

## Cấu trúc thư mục khuyến nghị

App đọc TÊN FILE (không quan tâm file nằm thư mục con nào), nên có thể gom audio và ảnh vào 2
thư mục con riêng cho gọn, hoặc để chung 1 thư mục — cả hai cách đều nạp được khi bấm
"🎧 Thêm folder audio (Listening)" và chọn thư mục gốc (toeic-listening ở ví dụ dưới).

\`\`\`
toeic-listening/
├── audio/
│   ├── q1.mp3
│   ├── q2.mp3
│   ├── q7.mp3
│   └── q32.mp3        (dùng chung cho cả nhóm Part 3 câu 32-34)
└── image/
    ├── q1.jpg
    ├── q2.jpg
    └── q3.jpg
\`\`\`

Lưu ý: chỉ Part 1 cần ảnh. Phải chọn đúng thư mục GỐC (toeic-listening) khi bấm nạp, không chọn
riêng thư mục audio/ hoặc image/ — nếu không sẽ thiếu 1 trong 2 loại file.

## Tạo ảnh cho Part 1 bằng AI (nếu chưa có ảnh thật)

Mỗi câu Part 1 cần 1 ảnh mô tả 1 tình huống/hành động đơn giản (người, vật, khung cảnh văn phòng/
đường phố/nhà...), khớp với đúng 1 trong 4 đáp án. Có thể dùng prompt sau cho từng câu, đưa cho
công cụ tạo ảnh AI:

\`\`\`
Tạo 1 ảnh minh hoạ cho câu hỏi TOEIC Part 1 (mô tả tranh), ảnh ĐEN TRẮNG (grayscale, không màu) –
giống đúng ảnh trong đề thi TOEIC thật, phong cách ảnh chụp thực tế, không chữ/không watermark
trong ảnh. Nội dung: <mô tả đúng đáp án đúng, vd "a man typing on a laptop at an office desk">.
Ảnh phải thể hiện đúng hành động/vị trí này làm trọng tâm, không mập mờ, để người xem có thể mô
tả lại bằng 1 câu tiếng Anh duy nhất.
\`\`\`

Sau khi có ảnh, đặt tên đúng theo \`number\` của câu (vd câu number: 1 → q1.jpg) rồi bỏ vào thư
mục image/ như cấu trúc trên.

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
transcript: |
  A man is typing on a laptop.
  A man is reading a newspaper.
  A woman is watering plants.
  A woman is painting a wall.
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
transcript: |
  When does the meeting start?
  At 9 A.M.
  In the conference room.
  Next Tuesday.
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
transcript: |
  Woman: Hi, I'm calling about an order I placed last week. It still hasn't arrived.
  Man: I'm sorry about that. Let me check the tracking number for you.
  Woman: Thank you, I really need it before the weekend.
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
8. Ghi thêm transcript (multiline, mỗi dòng 1 câu audio đọc riêng) nếu muốn câu đó dùng được chế độ "Nghe & gõ lại" ở tab Học — câu thiếu transcript vẫn luôn hoạt động bình thường ở chế độ chọn đáp án.
9. Không thêm text nào ngoài các block --- ... ---.

---
# YÊU CẦU (điền vào phần dưới rồi gửi cho AI để generate bộ đề)

Part muốn tạo: <1 / 2 / 3 / 4 / mix>
Số lượng câu hỏi: <điền số lượng>
Chủ đề hội thoại/bài nói (nếu Part 3-4): <vd: gọi điện công ty, thông báo nội bộ, quảng cáo>
Ghi chú thêm: <vd: độ khó, tránh trùng chủ đề đã có>`

// Playbook để đưa thẳng cho 1 AI khác (vd 1 phiên Claude riêng) tự tạo audio + ảnh Part 1 cho đề
// đã viết — ghi lại đúng cách đã làm thành công trong môi trường AI chỉ có pip/npm, không có
// công cụ TTS/tạo ảnh có sẵn, để lần sau không phải dò lại từ đầu. Giữ nguyên nội dung gốc, không
// diễn giải lại, vì đây là hướng dẫn kỹ thuật chính xác (tên package, version, toạ độ vẽ...).
const ASSET_GENERATION_GUIDE = `# Quy trình tạo audio và ảnh cho đề Listening (dành cho AI đọc để làm nhanh, không phải dò lại)

Phần này ghi lại cách đã làm thành công trong môi trường làm việc của AI (Linux, chỉ truy cập được pip/npm và GitHub). Làm đúng theo thứ tự dưới đây, không cần thử lại các hướng đã thất bại.

## 0. Quy ước chung

- Tên file bắt buộc: \`q<number>.mp3\` và \`q<number>.jpg\`, \`<number>\` đúng bằng field \`number\` trong file .md.
- Part 3-4: cả nhóm 3 câu dùng chung 1 audio, đặt tên theo number của câu ĐẦU nhóm (vd q32.mp3 cho câu 32-34).
- Đóng gói giao cho người dùng thành MỘT file zip duy nhất theo đúng cấu trúc:

\`\`\`
toeic-listening/
├── audio/   q1.mp3, q2.mp3, q7.mp3, q32.mp3 ...
└── image/   q1.jpg ... q6.jpg   (chỉ Part 1)
\`\`\`

- Không ghi vào thư mục trên máy người dùng nếu họ chưa xác nhận; mặc định chỉ gửi file zip.
- AI không nghe được audio nên không kiểm tra được chất lượng giọng; nói rõ điều này khi giao.
- Không dùng icon trong file hay trong lời giao.

## 1. Những thứ KHÔNG dùng được (đã thử, bỏ qua)

- Không có sẵn công cụ đọc giọng nói (espeak, piper, festival...). Chỉ có ffmpeg.
- Không tải được từ HuggingFace (bị chặn mạng), nên không dùng piper hay kokoro tải model từ HuggingFace.
- Không có công cụ tạo ảnh. Ảnh Part 1 phải tự vẽ bằng code (xem mục 4).
- \`pip install sherpa-onnx\` bản mới nhất (2.0.1) bị lỗi "phoneme_codepoints is empty ... no frontend available", đọc ra 0 giây. Phải ghim bản 1.12.40.

## 2. Cài đặt (làm một lần mỗi phiên)

\`\`\`bash
mkdir -p /home/claude/tts && cd /home/claude/tts
pip install --break-system-packages -q "sherpa-onnx==1.12.40" soundfile numpy cairosvg pillow
curl -sSL -o m.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-libritts_r-medium.tar.bz2
tar xjf m.tar.bz2     # ra thư mục vits-piper-en_US-libritts_r-medium (khoảng 82 MB)
\`\`\`

Model libritts_r có 904 giọng (sid), một model cho cả giọng nam và nữ.

## 3. Tạo audio

File \`lib.py\` (nạp model, hàm đọc):

\`\`\`python
import sherpa_onnx, numpy as np
D="/home/claude/tts/vits-piper-en_US-libritts_r-medium"
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
  vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{D}/en_US-libritts_r-medium.onnx",
  tokens=f"{D}/tokens.txt",data_dir=f"{D}/espeak-ng-data"),num_threads=4,provider="cpu"))
tts=sherpa_onnx.OfflineTts(cfg)
SR=tts.sample_rate   # 22050
def syn(text,sid,speed=0.95):
    return np.array(tts.generate(text,sid=sid,speed=speed).samples,dtype=np.float32)
\`\`\`

Giọng đã chọn (đã đo cao độ để phân biệt nam nữ, dùng lại luôn, không cần dò):
- Người dẫn "Number N": sid 0 (nữ).
- Nam: sid 21 (cũng dùng được 3, 6, 27, 48, 51, 90).
- Nữ: sid 12 (cũng dùng được 9, 15, 18, 30, 33, 39).
- Muốn thêm giọng khác: đọc thử 1 câu bằng nhiều sid rồi đo tần số cơ bản; dưới khoảng 135 Hz là nam, trên khoảng 175 Hz là nữ.

Khung ghép audio (mỗi câu hỏi = 1 file mp3):

\`\`\`python
import soundfile as sf, subprocess, os
def sil(s): return np.zeros(int(SR*s),dtype=np.float32)
def save(n,parts):
    a=np.concatenate(parts+[sil(1.0)])
    sf.write(f"out/q{n}.wav",a,SR)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f"out/q{n}.wav","-ac","1","-b:a","96k",f"out/q{n}.mp3"],check=True)
    os.remove(f"out/q{n}.wav")
\`\`\`

Cách ghép từng Part (thời gian nghỉ đã dùng):
- Part 1: "Number N." (sid 0), nghỉ 1.5 giây, rồi 4 câu mô tả A, B, C, D, mỗi câu cách nhau 1.8 giây. Không đọc tên chữ cái A, B, C, D (đề thật không đọc). Một giọng cho cả câu, luân phiên nam nữ giữa các câu.
- Part 2: "Number N." (sid 0), nghỉ 1.0 giây, câu hỏi (giọng X), nghỉ 1.3 giây, rồi 3 đáp án bằng giọng ngược giới tính với người hỏi, mỗi đáp án cách nhau 1.3 giây.
- Part 3 (hội thoại): tách từng lượt "Woman:" / "Man:", đọc bằng sid nữ / nam tương ứng, nghỉ khoảng 0.6 giây giữa các lượt. Lấy transcript trong file .md làm nguồn, bỏ nhãn "Woman:" và "Man:" khi đọc. Nhóm 3 câu dùng 1 file \`q<number đầu nhóm>.mp3\`.
- Part 4 (bài nói): một giọng đọc liền cả bài, tốc độ khoảng 0.95. Một file cho cả nhóm.
- Câu có số, giờ, ký hiệu: viết lại thành chữ trước khi đọc (vd "9 A.M." đọc là "nine A M", "$50" đọc là "fifty dollars") để giọng đọc không sai.

Khi chạy script, thêm \`2>/dev/null\` hoặc lọc bớt log, vì thư viện in cảnh báo rất nhiều dòng.

## 4. Tạo ảnh Part 1

Ảnh Part 1 trong đề TOEIC thật là ĐEN TRẮNG (thang xám). Cách làm: vẽ SVG bằng code, render ra PNG bằng \`cairosvg\`, rồi chuyển sang thang xám và lưu thành jpg.

Nguyên tắc nội dung tranh:
- Mỗi tranh thể hiện đúng MỘT hành động, khớp với đáp án đúng, không mập mờ.
- Phải có sẵn các bẫy hợp lý nhưng KHÔNG làm đáp án sai thành đúng: vd đáp án sai là "writing" thì không để người trong tranh cầm bút; đáp án sai là "carrying a ladder" thì không vẽ cái thang.
- Có thể đưa vật thật có trong tranh làm bẫy (bảng trắng, cuốn sổ đóng) nhưng người trong tranh không dùng vật đó.
- Không có chữ, không watermark.
- Phong cách phẳng: đầu hình tròn, thân là nét dày bo tròn (stroke-linecap round), tay chân là polyline bo tròn. Khung 1000 x 700.

Các hàm hỗ trợ đã dùng:

\`\`\`python
import cairosvg, io
from PIL import Image, ImageOps
SK='#f1c7a2'
def limb(pts,w,c):
    d="M"+" L".join(f"{x},{y}" for x,y in pts)
    return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def circ(x,y,r,c): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'
def rect(x,y,w,h,c,rx=0,extra=''):
    if isinstance(rx,str): extra=rx; rx=0
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{c}" {extra}/>'
def wrap(body): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">{body}</svg>'

def to_jpg_bw(svg,path):
    png=cairosvg.svg2png(bytestring=svg.encode(),output_width=1000,output_height=700)
    im=Image.open(io.BytesIO(png)).convert('L')
    ImageOps.autocontrast(im,cutoff=1).save(path,quality=92)
\`\`\`

Cách dựng một người (nhìn nghiêng, quay sang phải), toạ độ tham khảo:
- Chân: \`limb([(322,440),(308,565)],30,'#2f3b52')\` và chân thứ hai, bàn chân là ellipse đen.
- Thân: \`limb([(335,300),(335,445)],76,màu_áo)\`.
- Đầu: \`circ(338,235,40,SK)\` cộng tóc (path nửa vòng tròn) và một chấm mắt lệch về hướng đang quay.
- Tay: \`limb([vai, khuỷu, bàn tay],22,SK)\`, ống tay áo là đoạn đầu với màu áo; bàn tay là circle bán kính 14 đến 16.
- Muốn chỉ tay: thêm một nét mảnh \`limb(..., 9, SK)\` kéo dài từ bàn tay làm ngón trỏ.

Các cảnh đã làm cho Part 1 trong bộ q1-q6 (dùng lại nếu cần làm lại): đẩy xe hàng (q1), với tay lấy sách ở kệ cao (q2), đưa tài liệu cho người khác (q3), chỉ vào biểu đồ trên bảng trắng có người ngồi nghe (q4), gõ laptop với cuốn sổ đóng trên bàn (q5), đội mũ bảo hộ đứng tay không (q6).

Sau khi vẽ xong PHẢI ghép các ảnh thành một tấm xem trước (3 cột x 2 hàng) rồi mở xem để kiểm tra từng tranh có khớp đáp án đúng và không vô tình làm đáp án sai thành đúng, trước khi giao.

## 5. Đóng gói và giao

\`\`\`python
import zipfile
z=zipfile.ZipFile('toeic-listening.zip','w',zipfile.ZIP_DEFLATED)
for n in audio_numbers: z.write(f'tts/out/q{n}.mp3',f'toeic-listening/audio/q{n}.mp3')
for n in image_numbers: z.write(f'img/gray/q{n}.jpg',f'toeic-listening/image/q{n}.jpg')
z.close()
\`\`\`

Giao file \`toeic-listening.zip\` bằng công cụ gửi file. Dặn người dùng khi nạp vào app: chọn thư mục gốc \`toeic-listening\`, không chọn riêng \`audio/\` hay \`image/\`.

## 6. Danh sách kiểm tra trước khi giao

1. Số file audio khớp với tập \`number\` của các câu (Part 3-4: một file cho mỗi nhóm 3 câu, đặt theo number đầu nhóm).
2. Số ảnh đúng bằng số câu Part 1, đã chuyển sang đen trắng.
3. Cấu trúc zip đúng \`toeic-listening/audio/\` và \`toeic-listening/image/\`.
4. Nói rõ audio là giọng máy và AI chưa nghe thử; ảnh là tranh minh họa vẽ bằng code, không phải ảnh chụp.
5. Nếu người dùng muốn ảnh chụp thực tế: dùng prompt mẫu trong mục "Tạo ảnh cho Part 1 bằng AI" của file hướng dẫn để họ tự tạo bằng công cụ khác.`

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
              thư mục con nào — có thể tách audio/ảnh ra 2 thư mục con cho gọn. Khi bấm nạp, chọn đúng
              thư mục GỐC (vd <code>toeic-listening</code>), không chọn riêng <code>audio/</code> hoặc <code>image/</code>.
            </p>
            <pre className="m-0 bg-muted border rounded-lg p-3 font-mono text-xs overflow-x-auto">{`toeic-listening/
├── audio/
│   ├── q1.mp3
│   ├── q7.mp3
│   └── q32.mp3   (dùng chung Part 3 câu 32-34)
└── image/
    ├── q1.jpg
    ├── q2.jpg
    └── q3.jpg`}</pre>
            <p className="text-xs">Chỉ Part 1 cần ảnh. Sau khi nạp, panel bên trái sẽ hiện số audio/ảnh đã khớp và liệt kê file nào bị bỏ qua (không khớp tên) để dễ soát lại.</p>
          </div>

          <div className="border rounded-lg p-3.5 flex flex-col gap-2">
            <p className="font-semibold text-foreground">🖼 Tạo ảnh Part 1 bằng AI (nếu chưa có ảnh thật)</p>
            <p>
              Mỗi câu Part 1 cần đúng 1 ảnh mô tả 1 hành động/tình huống khớp với đáp án đúng. Ảnh đề
              TOEIC thật luôn là <strong className="text-foreground">ảnh đen trắng</strong> — nhớ ghi rõ
              trong prompt, đừng để AI tạo ảnh màu rồi dễ bị nhầm với ảnh minh hoạ thường. Prompt mẫu cho từng câu:
            </p>
            <CopyBlock text={`Tạo 1 ảnh minh hoạ cho câu hỏi TOEIC Part 1 (mô tả tranh), ảnh ĐEN TRẮNG (grayscale, không màu) – giống đúng ảnh trong đề thi TOEIC thật, phong cách ảnh chụp thực tế, không chữ/không watermark trong ảnh. Nội dung: <mô tả đúng đáp án đúng, vd "a man typing on a laptop at an office desk">. Ảnh phải thể hiện đúng hành động/vị trí này làm trọng tâm, không mập mờ, để người xem có thể mô tả lại bằng 1 câu tiếng Anh duy nhất.`} />
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
            🐢 Mỗi audio trong app có nút chọn tốc độ phát (0.5x/0.75x/0.85x/1x) cạnh thanh nghe —
            dùng khi nghe chưa rõ 1 câu nào đó, không cần tạo lại audio chậm hơn riêng.
            Nếu audio là do AI tự tạo (TTS, xem mục "Nhờ AI tự tạo audio" ở trên) và khi nghe kỹ
            (kể cả ở tốc độ chậm) thấy transcript ghi KHÔNG khớp với thực tế đọc ra — có thể do TTS
            đọc sai/nuốt một từ nào đó — hãy sửa lại transcript cho đúng với audio thật đang có
            (transcript phải mô tả đúng cái tai nghe được), không sửa ngược lại audio.
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
