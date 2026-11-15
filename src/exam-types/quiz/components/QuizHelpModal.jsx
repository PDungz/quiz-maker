import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const FIELDS = [
  ['id', 'Không', <>Định danh câu hỏi, vd <code>q1</code></>],
  ['category', 'Không', <>Chủ đề, vd <code>React</code></>],
  ['subcategory', 'Không', 'Chủ đề con'],
  ['difficulty', 'Không', <><code>easy</code> / <code>medium</code> / <code>hard</code></>],
  ['type', 'Không', <><code>single_choice</code> hoặc <code>multiple_choice</code></>],
  ['question', 'Có', 'Nội dung câu hỏi'],
  ['options', 'Có', 'Các lựa chọn dạng key-value'],
  ['correct_answer', 'Có', <>Key đáp án đúng, vd <code>A</code> hoặc <code>[A, C]</code></>],
  ['code', 'Không', <>Đoạn code, dùng <code>|</code> để giữ format</>],
  ['code_lang', 'Không', <>Ngôn ngữ code, vd <code>dart</code></>],
  ['explanation', 'Không', 'Giải thích đáp án'],
  ['tags', 'Không', <>Danh sách tag, vd <code>[react, hook]</code></>],
  ['point', 'Không', <>Điểm câu hỏi khi chấm theo thang điểm, vd <code>2</code>. Không set thì tự tính theo độ khó</>],
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

const FULL_GUIDE = `# Quy tắc định dạng file câu hỏi (.md) — Quiz Maker

Tài liệu này mô tả chính xác định dạng file Markdown mà app Quiz Maker đọc được.
Dùng để: (1) người đọc tự viết file tay, (2) làm prompt đưa cho AI (ChatGPT, Claude...) generate bộ câu hỏi đúng chuẩn.

## Cấu trúc tổng quát

Mỗi câu hỏi là một block nằm giữa hai dấu \`---\`. Nhiều câu hỏi nối tiếp nhau trong cùng một file, phân cách bằng \`---\`.

## Các trường (field)

| Trường | Bắt buộc | Kiểu | Mô tả |
|---|---|---|---|
| id | Không | string | Định danh duy nhất, vd js-001 |
| category | Không | string | Chủ đề, vd JavaScript, React |
| subcategory | Không | string | Chủ đề con |
| difficulty | Không | enum | easy \\| medium \\| hard (mặc định medium) |
| type | Không | enum | single_choice \\| multiple_choice (mặc định single_choice) |
| question | Có | string | Nội dung câu hỏi |
| options | Có | map | Các lựa chọn dạng key: value, key thường là A, B, C, D |
| correct_answer | Có | string \\| array | Key đáp án đúng, vd A. Nếu multiple_choice thì là mảng, vd [A, C] |
| code | Không | block scalar | Đoạn code đính kèm, dùng \\| để giữ nguyên xuống dòng/indent |
| code_lang | Không | string | Ngôn ngữ code, vd dart, javascript, sql |
| explanation | Không | string | Giải thích đáp án, hiện sau khi trả lời |
| tags | Không | array | Danh sách tag, vd [react, hook, useState] |
| point | Không | number | Điểm của câu hỏi khi tính theo thang điểm. Không set thì app tự gán theo difficulty (easy=1, medium=2, hard=3) hoặc theo cấu hình lúc tạo đề |

## Ví dụ câu hỏi đơn giản (single_choice)

---
id: q1
category: JavaScript
subcategory: ES6
difficulty: medium
type: single_choice
question: Arrow function khác gì với function thường?
options:
  A: Không có this riêng
  B: Không thể có tham số
  C: Chạy nhanh hơn
  D: Không có sự khác biệt
correct_answer: A
explanation: Arrow function kế thừa this từ lexical scope bao ngoài, không có this riêng.
tags: [arrow-function, this, es6]
point: 2
---

## Ví dụ câu hỏi kèm code

---
id: dart-001
category: Dart
difficulty: medium
type: single_choice
code_lang: dart
question: What is the output of the following code?
code: |
  void main() async {
    print('A');
    await Future.delayed(Duration.zero);
    print('B');
  }
options:
  A: A B
  B: B A
correct_answer: A
explanation: await nhường event loop, nhưng B vẫn chạy sau đó.
---

## Ví dụ câu hỏi nhiều đáp án (multiple_choice)

---
id: q2
category: React
difficulty: hard
type: multiple_choice
question: Các hook nào sau đây là built-in của React?
options:
  A: useState
  B: useLocalStorage
  C: useEffect
  D: useDebounce
correct_answer: [A, C]
explanation: useState và useEffect là hook built-in. useLocalStorage và useDebounce là custom hook.
---

## Quy tắc quan trọng khi tạo file (áp dụng cho cả người viết tay lẫn AI generate)

1. correct_answer là 1 key duy nhất nếu type: single_choice, hoặc mảng [A, C] nếu type: multiple_choice.
2. Nếu câu hỏi có đoạn code riêng, dùng code_lang + code: | rồi xuống dòng, indent code sâu hơn indent của "code:".
3. Có thể dùng backtick \`...\` để inline code ngay trong question/options/explanation.
4. point là số nguyên tuỳ chọn, đại diện điểm số câu hỏi khi chấm theo thang điểm (không phải đếm số câu đúng). Nếu không chắc, cứ set theo độ khó: easy=1, medium=2, hard=3.
5. Không thêm text nào ngoài các block --- ... ---.
6. File kết quả phải là .md thuần, không bọc trong markdown code fence khi xuất ra.

---
# YÊU CẦU (điền vào phần dưới rồi gửi cho AI để generate bộ câu hỏi)

Chủ đề: <điền chủ đề bạn muốn>
Số lượng câu hỏi: <điền số lượng>
Độ khó: <easy / medium / hard / mix>
Ghi chú thêm: <ví dụ: ưu tiên câu hỏi có code, tránh trùng lặp với bộ đã có, v.v.>`

export default function QuizHelpModal({ onClose }) {
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
          <DialogTitle>📄 Định dạng file Markdown</DialogTitle>
          <Button variant={copied ? 'default' : 'outline'} size="sm" onClick={copyAll}>
            {copied ? '✓ Đã copy toàn bộ' : '📋 Copy toàn bộ hướng dẫn'}
          </Button>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm text-muted-foreground min-w-0">
          <p className="bg-muted border-l-[3px] border-l-primary rounded-lg px-3.5 py-2.5">
            Đây là quy tắc định dạng đầy đủ — vừa để bạn đọc hiểu, vừa để dán thẳng cho AI (ChatGPT, Claude...)
            làm prompt sinh bộ câu hỏi đúng chuẩn. Bấm <strong>Copy toàn bộ hướng dẫn</strong> ở trên, điền phần
            "Chủ đề / Số lượng / Độ khó" ở cuối rồi gửi cho AI.
          </p>

          <p>Mỗi câu hỏi là một block nằm giữa hai dấu <code>---</code>. Các trường bắt buộc: <code>question</code>, <code>options</code>, <code>correct_answer</code>.</p>

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

          <p>Toàn bộ nội dung sẽ được copy (bấm nút ở góc trên):</p>
          <CopyBlock text={FULL_GUIDE} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
