import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CardRelatedInfo from './CardRelatedInfo'

// Hiển thị 1 thẻ từ vựng tại 1 thời điểm: mặt trước chỉ có word, bấm để lật sang mặt sau xem
// nghĩa/ví dụ/các nhóm liên hệ (họ từ cùng gốc khác từ loại, đồng nghĩa, đối nghĩa, cụm cố định),
// sau đó tự đánh giá mức nhớ bằng 1 trong 4 nút — đúng luồng Anki/Quizlet, khác hẳn mô hình chọn
// đáp án của Quiz/TOEIC nên không tái dùng OptionItem.
export default function FlashcardView({ card, current, total, flipped, onFlip, onReview }) {
  return (
    <div className="flex flex-col gap-4 items-center">
      <span className="text-sm text-muted-foreground">{current + 1} / {total}</span>

      <Card
        className="w-full max-w-md min-h-56 cursor-pointer flex items-center justify-center text-center"
        onClick={onFlip}
      >
        <CardContent className="flex flex-col items-center gap-3">
          {!flipped ? (
            <>
              <p className="text-2xl font-semibold">{card.word}</p>
              {card.pronunciation && <p className="text-sm text-muted-foreground">{card.pronunciation}</p>}
              <p className="text-xs text-muted-foreground mt-2">Bấm để xem nghĩa</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {card.partOfSpeech && <Badge variant="outline">{card.partOfSpeech}</Badge>}
                <p className="text-xl font-semibold">{card.word}</p>
              </div>
              <p className="text-base">{card.meaning}</p>
              <CardRelatedInfo card={card} />
            </>
          )}
        </CardContent>
      </Card>

      {flipped && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-md">
          <Button variant="destructive" onClick={() => onReview('forgot')}>Quên</Button>
          <Button variant="outline" onClick={() => onReview('hard')}>Khó</Button>
          <Button variant="secondary" onClick={() => onReview('good')}>Bình thường</Button>
          <Button onClick={() => onReview('easy')}>Dễ</Button>
        </div>
      )}
    </div>
  )
}
