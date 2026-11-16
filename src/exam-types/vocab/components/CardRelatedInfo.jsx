import { Badge } from '@/components/ui/badge'

// Màu riêng cho từng nhóm liên hệ, giống cách ExplanationText tô màu <hl type="..."> ở TOEIC —
// mỗi loại 1 màu để phân biệt nhanh khi học theo nhóm (họ từ cùng gốc, đồng nghĩa, đối nghĩa...).
// Dùng cho word_family/collocations — mỗi item là 1 string tự do (có thể đã ghi từ loại gọn
// trong chuỗi, vd "decision (n)"), không cần phân loại riêng.
export function RelatedGroup({ label, items, className }) {
  if (!items?.length) return null
  return (
    <div className="flex flex-col gap-1.5 items-center">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {items.map(item => <Badge key={item} className={className}>{item}</Badge>)}
      </div>
    </div>
  )
}

// Dùng cho synonyms/antonyms — mỗi item được phân loại như từ chính (word + từ loại + nghĩa
// riêng), vì 1 từ gần/trái nghĩa có thể khác từ loại hoặc sắc thái với từ chính, học trơ 1 chữ
// không đủ để phân biệt.
export function RelatedWordGroup({ label, items, className }) {
  if (!items?.length) return null
  return (
    <div className="flex flex-col gap-1.5 items-center w-full">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex flex-col gap-1 w-full">
        {items.map(item => (
          <div key={item.word} className={`flex items-center gap-2 rounded-md px-2.5 py-1 text-sm ${className}`}>
            <span className="font-medium">{item.word}</span>
            {item.partOfSpeech && <span className="text-xs opacity-80">({item.partOfSpeech})</span>}
            {item.meaning && <span className="text-xs opacity-80 ml-auto text-right">{item.meaning}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// Toàn bộ thông tin phụ của 1 thẻ (ví dụ, 4 nhóm liên hệ) — dùng chung giữa FlashcardView (mặt
// sau thẻ) và TypingCardView (sau khi chấm xong), tránh lặp lại cùng 1 khối JSX ở 2 nơi.
export default function CardRelatedInfo({ card }) {
  return (
    <>
      {card.example && <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">{card.example}</p>}
      <RelatedGroup label="Họ từ cùng gốc" items={card.wordFamily} className="bg-blue-500/15 text-blue-700 dark:text-blue-300" />
      <RelatedWordGroup label="Đồng nghĩa" items={card.synonyms} className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" />
      <RelatedWordGroup label="Đối nghĩa" items={card.antonyms} className="bg-destructive/15 text-destructive" />
      <RelatedGroup label="Cụm cố định" items={card.collocations} className="bg-purple-500/15 text-purple-700 dark:text-purple-300" />
    </>
  )
}
