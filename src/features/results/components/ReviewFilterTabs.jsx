import { isCorrect } from '../../../utils/quiz'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

const TABS = [
  { key: 'all', label: 'Tất cả', activeClass: 'bg-primary text-primary-foreground' },
  { key: 'correct', label: 'Đúng', activeClass: 'bg-success text-success-foreground' },
  { key: 'wrong', label: 'Sai', activeClass: 'bg-destructive text-white' },
  { key: 'skipped', label: 'Bỏ qua', activeClass: 'bg-muted-foreground text-background' },
]

export default function ReviewFilterTabs({ questions, answers, reviewFilter, onFilterChange, selectedSet, onSelectMany }) {
  const statusOf = (q, i) => {
    const ans = answers[i] ?? new Set()
    if (!ans.size) return 'skipped'
    return isCorrect(q, ans) ? 'correct' : 'wrong'
  }

  const indicesFor = (key) => questions
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => key === 'all' || statusOf(q, i) === key)
    .map(({ i }) => i)

  return (
    <div className="flex gap-1 flex-wrap bg-muted border rounded-lg p-1 mb-4.5">
      {TABS.map(tab => {
        const indices = indicesFor(tab.key)
        const count = indices.length
        const allSelected = onSelectMany && count > 0 && indices.every(i => selectedSet?.has(i))
        const active = reviewFilter === tab.key
        return (
          <div
            key={tab.key}
            role="button"
            tabIndex={0}
            className={`px-3.5 py-2.5 rounded-md text-[0.75rem] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              active ? tab.activeClass : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onFilterChange(tab.key)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onFilterChange(tab.key)}
          >
            {onSelectMany && (
              <Checkbox
                checked={allSelected}
                disabled={count === 0}
                onClick={e => e.stopPropagation()}
                onCheckedChange={() => onSelectMany(indices, !allSelected)}
                title={`Chọn tất cả câu ở mục "${tab.label}"`}
                className={active ? 'border-white data-checked:bg-white data-checked:text-foreground' : ''}
              />
            )}
            {tab.label} <Badge variant="secondary" className="h-4 px-1.5">{count}</Badge>
          </div>
        )
      })}
    </div>
  )
}
