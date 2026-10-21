import { isCorrect } from '../utils/quiz'

const TABS = [
  { key: 'all', label: 'Tất cả', cls: '' },
  { key: 'correct', label: 'Đúng', cls: 'filter-correct' },
  { key: 'wrong', label: 'Sai', cls: 'filter-wrong' },
  { key: 'skipped', label: 'Bỏ qua', cls: 'filter-skipped' },
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
    <div className="review-filter">
      {TABS.map(tab => {
        const indices = indicesFor(tab.key)
        const count = indices.length
        const allSelected = onSelectMany && count > 0 && indices.every(i => selectedSet?.has(i))
        return (
          <div
            key={tab.key}
            role="button"
            tabIndex={0}
            className={`review-filter-btn ${tab.cls}${reviewFilter === tab.key ? ' active' : ''}`}
            onClick={() => onFilterChange(tab.key)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onFilterChange(tab.key)}
          >
            {onSelectMany && (
              <input
                type="checkbox"
                className="review-filter-tab-check"
                checked={allSelected}
                disabled={count === 0}
                onClick={e => e.stopPropagation()}
                onChange={() => onSelectMany(indices, !allSelected)}
                title={`Chọn tất cả câu ở mục "${tab.label}"`}
              />
            )}
            {tab.label} <span className="review-filter-count">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
