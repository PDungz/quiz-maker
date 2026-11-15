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
export default function OptionItem({ optionKey, text, status, disabled, onClick }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 bg-card border-[1.5px] rounded-lg px-4 py-3 select-none transition-colors',
        STATUS_STYLES[status],
        disabled ? 'cursor-default' : 'cursor-pointer hover:border-primary/50'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <span className={cn('w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-xs font-bold', KEY_STATUS_STYLES[status])}>
        {optionKey}
      </span>
      <span className="text-sm leading-normal pt-0.5">{text}</span>
    </div>
  )
}
