import { cn } from '@/lib/utils'

const STATUS_STYLES = {
  none: 'border-border',
  selected: 'border-primary',
  correct: 'border-success bg-success/10',
  wrong: 'border-destructive bg-destructive/10',
  'reveal-correct': 'border-success bg-success/10',
}

const KEY_STATUS_STYLES = {
  none: 'bg-muted text-muted-foreground',
  selected: 'bg-primary text-primary-foreground',
  correct: 'bg-success text-success-foreground',
  wrong: 'bg-destructive text-white',
  'reveal-correct': 'bg-success text-success-foreground',
}

// 1 đáp án trong danh sách lựa chọn — dùng chung cho màn từng câu, scroll-view, review.
// status: 'none' | 'selected' | 'correct' | 'wrong' | 'reveal-correct' (xem quiz-session/utils/revealRules.js)
// hideText: ẩn nội dung đáp án (vd luyện Listening giống thi thật, chỉ nghe không đọc được chữ)
// nhưng vẫn giữ nút bấm A/B/C/D để chọn — khác "disabled" là khoá hẳn tương tác.
// className: cho phép ép thêm chiều cao (vd h-full khi đặt trong 1 CSS Grid cần khớp hàng với ô
// khác cao hơn) mà không phải định nghĩa lại style mặc định.
export default function OptionItem({ optionKey, text, status, disabled, hideText, onClick, className }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 bg-card border-[1.5px] rounded-lg px-4 py-3 select-none transition-colors',
        STATUS_STYLES[status],
        disabled ? 'cursor-default' : 'cursor-pointer hover:border-primary/50',
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      <span className={cn('w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-xs font-bold', KEY_STATUS_STYLES[status])}>
        {optionKey}
      </span>
      {!hideText && <span className="text-sm leading-normal pt-0.5">{text}</span>}
    </div>
  )
}
