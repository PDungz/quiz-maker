// Màu nhạt riêng cho từng loại dấu hiệu nhận biết, giống cách sách luyện thi chữa bài bằng
// nhiều màu bút dạ quang khác nhau (ngữ pháp, thời gian, collocation, từ nối...).
const HL_COLOR = {
  grammar: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  time: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  collocation: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  connector: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  vocab: 'bg-pink-500/15 text-pink-700 dark:text-pink-300',
}
const HL_DEFAULT_COLOR = 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-200'

// Render phần giải thích đáp án, nhận diện tag <hl type="...">...</hl> trong text thô (field
// explanation của câu hỏi) và tô màu theo loại dấu hiệu — ngữ pháp/thời gian/collocation/từ nối...
// Dùng chung cho mọi exam-type (Quiz, TOEIC) vì cách hiển thị explanation giống nhau, chỉ nội
// dung .md khác nhau.
export default function ExplanationText({ text, className }) {
  if (!text) return null

  // tạo regex mới mỗi lần gọi — không mutate 1 instance dùng chung giữa các lần render
  const hlTagRe = /<hl(?:\s+type="([\w-]+)")?>([\s\S]*?)<\/hl>/g
  const parts = []
  let lastIndex = 0
  let match
  while ((match = hlTagRe.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    const [, type, inner] = match
    parts.push(
      <mark key={match.index} className={`rounded px-1 py-0.5 font-medium ${HL_COLOR[type] ?? HL_DEFAULT_COLOR}`}>
        {inner}
      </mark>
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))

  return <span className={className}>{parts}</span>
}
