import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const FIELDS = [
  ['word', 'Có', 'Từ cần học, vd resilient'],
  ['meaning', 'Có', 'Nghĩa/dịch nghĩa, hiện ở mặt sau thẻ'],
  ['example', 'Không', 'Câu ví dụ dùng từ này'],
  ['pronunciation', 'Không', 'Phiên âm IPA, vd /ri\'zIlient/'],
  ['part_of_speech', 'Không', 'Từ loại, vd noun, verb, adjective'],
  ['category', 'Không', 'Tên bộ từ/chủ đề, vd TOEIC-700'],
  ['tags', 'Không', 'Danh sách tag tự do để lọc, vd [toeic, adjective]'],
  ['word_family', 'Không', 'Họ từ cùng gốc, khác từ loại — vd [decision (n), decisive (adj)]'],
  ['synonyms', 'Không', 'Từ đồng nghĩa — nên viết dạng word + part_of_speech + meaning riêng, không chỉ 1 chữ trơn'],
  ['antonyms', 'Không', 'Từ đối nghĩa — cùng cấu trúc như synonyms'],
  ['collocations', 'Không', 'Cụm từ/collocation cố định thường đi kèm, vd [make a decision]'],
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
      <Button variant={copied ? 'default' : 'outline'} size="sm" className="absolute top-2 right-2" onClick={copy}>
        {copied ? '✓ Đã copy' : '📋 Copy'}
      </Button>
      <pre className="m-0 w-full max-h-[360px] overflow-y-auto whitespace-pre-wrap break-words bg-muted border rounded-lg p-3.5 font-mono text-xs"><code>{text}</code></pre>
    </div>
  )
}

const FULL_GUIDE = `# Quy tắc định dạng file bộ từ vựng (.md) — Quiz Maker

Mỗi thẻ từ vựng là 1 block nằm giữa hai dấu \`---\`, nhiều thẻ nối tiếp nhau trong cùng file.

## Các trường

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| word | Có | Từ cần học |
| meaning | Có | Nghĩa, hiện ở mặt sau thẻ |
| example | Không | Câu ví dụ |
| pronunciation | Không | Phiên âm IPA |
| part_of_speech | Không | Từ loại |
| category | Không | Tên bộ từ/chủ đề |
| tags | Không | Danh sách tag tự do, vd [toeic, adjective] |
| word_family | Không | Họ từ cùng gốc, khác từ loại — vd [decision (n), decisive (adj)] |
| synonyms | Không | Từ đồng nghĩa — mỗi item có word/part_of_speech/meaning riêng |
| antonyms | Không | Từ đối nghĩa — cùng cấu trúc như synonyms |
| collocations | Không | Cụm từ cố định thường đi kèm, vd [make a decision] |

## Học theo nhóm liên hệ (word_family/synonyms/antonyms/collocations)

TOEIC Part 5 hay hỏi dạng "chọn đúng từ loại trong 1 họ từ cùng gốc" (vd decide/decision/decisive/
decisively), hoặc phân biệt 2 từ gần nghĩa nhưng khác sắc thái/từ loại. word_family và
collocations là list string tự do (đã ghi gọn từ loại trong chuỗi, vd "decision (n)"). Riêng
synonyms/antonyms nên viết dạng list object — mỗi từ đồng/đối nghĩa được phân loại đầy đủ như
chính từ đó (word, part_of_speech, meaning riêng), vì chúng thường khác sắc thái hoặc từ loại:

synonyms:
  - word: determine
    part_of_speech: verb
    meaning: xác định, quyết định
  - word: resolve
    part_of_speech: verb
    meaning: giải quyết, dứt khoát hơn decide

Có thể viết tắt dạng string trơn (vd \`synonyms: [determine, resolve]\`) nếu không cần phân loại,
nhưng dạng object đầy đủ giúp phân biệt sắc thái rõ hơn khi học.

## Ví dụ đầy đủ (có cả 4 nhóm liên hệ)

---
word: decide
meaning: quyết định
example: The board will decide on the budget next week.
pronunciation: /dɪˈsaɪd/
part_of_speech: verb
word_family: [decision (n), decisive (adj), decisively (adv)]
synonyms:
  - word: determine
    part_of_speech: verb
    meaning: xác định, quyết định
  - word: resolve
    part_of_speech: verb
    meaning: giải quyết, dứt khoát hơn decide
antonyms:
  - word: hesitate
    part_of_speech: verb
    meaning: do dự, chần chừ
collocations: [make a decision, decide on]
tags: [toeic, verb]
---

---
word: resilient
meaning: kiên cường, dẻo dai
example: The team remained resilient despite setbacks.
pronunciation: /ri'zIlient/
part_of_speech: adjective
synonyms:
  - word: tough
    part_of_speech: adjective
    meaning: cứng cỏi, bền bỉ
  - word: adaptable
    part_of_speech: adjective
    meaning: dễ thích nghi
antonyms:
  - word: fragile
    part_of_speech: adjective
    meaning: dễ vỡ, mỏng manh
tags: [toeic, adjective]
---

---
word: ambiguous
meaning: mơ hồ, không rõ ràng
part_of_speech: adjective
---

## Cách học hoạt động (spaced repetition)

App dùng thuật toán SM-2 (giống Anki): mỗi thẻ có 1 lần ôn tiếp theo (dueAt). Sau khi lật thẻ
xem nghĩa, tự đánh giá 1 trong 4 mức:

- Quên — không nhớ gì, ôn lại sau 10 phút, hệ số dễ giảm.
- Khó — nhớ được nhưng khó, lần ôn tiếp theo gần hơn bình thường.
- Bình thường — nhớ đúng, lần ôn tiếp theo giãn ra theo hệ số dễ hiện tại.
- Dễ — nhớ ngay, lần ôn tiếp theo giãn xa hơn nữa.

Nhớ đúng liên tiếp (Bình thường/Dễ) sẽ giãn dần khoảng ôn: 1 ngày → 6 ngày → 15 ngày → ... Quên sẽ
reset về đầu chu kỳ. Tiến độ lưu riêng theo từng thẻ trong máy — nạp lại cùng file .md không làm
mất tiến độ đã học, chỉ mất khi bấm "Xoá tất cả".

Không thêm text nào ngoài các block --- ... ---.`

export default function VocabHelpModal({ onClose }) {
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
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex-row items-center justify-between pr-8 min-w-0">
          <DialogTitle>📄 Định dạng file bộ từ vựng</DialogTitle>
          <Button variant={copied ? 'default' : 'outline'} size="sm" onClick={copyAll}>
            {copied ? '✓ Đã copy toàn bộ' : '📋 Copy toàn bộ hướng dẫn'}
          </Button>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm text-muted-foreground min-w-0">
          <p className="bg-muted border-l-[3px] border-l-primary rounded-lg px-3.5 py-2.5">
            Mỗi thẻ từ vựng là 1 block giữa hai dấu <code>---</code>. Chỉ <code>word</code> và{' '}
            <code>meaning</code> là bắt buộc.
          </p>

          <p className="border rounded-lg p-3.5 text-xs">
            🔗 Gắn thêm <code>word_family</code> (họ từ cùng gốc khác từ loại, vd TOEIC Part 5 hỏi
            chọn đúng dạng từ) và <code>collocations</code> (cụm cố định) dạng list string.
            Riêng <code>synonyms</code>/<code>antonyms</code> nên viết dạng list object có{' '}
            <code>word</code>/<code>part_of_speech</code>/<code>meaning</code> riêng cho mỗi từ,
            vì từ đồng/đối nghĩa thường khác sắc thái hoặc từ loại với từ chính.
          </p>

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
            <p className="font-semibold text-foreground">🔁 Cách học hoạt động (spaced repetition kiểu Anki)</p>
            <p>Lật thẻ xem nghĩa rồi tự đánh giá mức nhớ: <strong>Quên</strong> / <strong>Khó</strong> / <strong>Bình thường</strong> / <strong>Dễ</strong>.</p>
            <p>Nhớ đúng liên tiếp giãn dần khoảng ôn (1 ngày → 6 ngày → 15 ngày...). Quên sẽ ôn lại sau 10 phút và reset chu kỳ.</p>
            <p className="text-xs">Tiến độ lưu riêng theo từng thẻ trong máy — nạp lại cùng file không mất tiến độ đã học.</p>
          </div>

          <p>Toàn bộ nội dung sẽ được copy (bấm nút ở góc trên):</p>
          <CopyBlock text={FULL_GUIDE} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
