import { getPoint, isCorrect } from '../../../utils/quiz'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import OptionItem from '@/components/OptionItem'
import ExplanationText from './ExplanationText'

const STATUS_BORDER = {
  correct: 'border-l-success',
  wrong: 'border-l-destructive',
  skipped: 'border-l-muted-foreground',
}

export default function ReviewScrollView({ questions, answers, reviewFilter, scoreMode, pointMode, customPoints, highlightIndex, selectedSet, onToggleSelect }) {
  const items = questions.map((q, i) => {
    const ans = answers[i] ?? new Set()
    const ck = new Set(q.correct_answer)
    const isSkipped = !ans.size
    const isOk = !isSkipped && isCorrect(q, ans)
    const status = isSkipped ? 'skipped' : isOk ? 'correct' : 'wrong'
    return { q, i, ans, ck, isSkipped, isOk, status }
  })
  const filtered = items.filter(it => reviewFilter === 'all' || reviewFilter === it.status)

  if (!filtered.length) {
    return <p className="text-sm text-muted-foreground text-center py-10">Không có câu nào thuộc mục này</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {filtered.map(({ q, i, ans, ck, isSkipped, isOk, status }) => {
        const wrongKeys = Object.keys(q.options).filter(k => !ck.has(k))
        return (
          <Card
            key={i}
            id={`review-q-${i}`}
            className={`border-l-[3px] ${STATUS_BORDER[status]} ${
              i === highlightIndex ? 'ring-2 ring-primary shadow-[0_0_0_4px_rgba(127,127,127,0.18)] transition-shadow duration-150' : ''
            }`}
          >
            <CardContent className="flex flex-col gap-3.5">
              <div className="flex gap-2 flex-wrap items-center">
                {onToggleSelect && (
                  <Checkbox
                    checked={selectedSet?.has(i) ?? false}
                    onCheckedChange={() => onToggleSelect(i)}
                    onClick={e => e.stopPropagation()}
                  />
                )}
                <Badge variant={status === 'correct' ? 'default' : status === 'wrong' ? 'destructive' : 'secondary'}
                  className={status === 'correct' ? 'bg-success text-success-foreground' : ''}>
                  {isSkipped ? '⏭ Bỏ qua' : isOk ? '✓ Đúng' : '✗ Sai'}
                </Badge>
                {q.category && <Badge variant="outline">{q.category}</Badge>}
                {q.difficulty && <Badge variant="secondary">{q.difficulty}</Badge>}
                {scoreMode === 'point' && (
                  <Badge variant="secondary">{isOk ? getPoint(q, pointMode, customPoints) : 0}/{getPoint(q, pointMode, customPoints)} điểm</Badge>
                )}
                <span className="ml-auto text-sm text-muted-foreground">#{i + 1}</span>
              </div>

              <div>
                <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">{q.question}</p>
                {q.code && (
                  <pre className="relative mt-3.5 bg-muted border border-border rounded-lg p-3.5 overflow-x-auto font-mono text-[0.83rem] leading-relaxed whitespace-pre">
                    {q.code_lang && (
                      <span className="absolute top-1.5 right-2.5 text-[0.65rem] text-muted-foreground font-sans uppercase tracking-wide">{q.code_lang}</span>
                    )}
                    <code>{q.code}</code>
                  </pre>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {Object.entries(q.options).map(([key, val]) => {
                  let status2 = 'none'
                  if (ck.has(key) && ans.has(key)) status2 = 'correct'
                  else if (!ck.has(key) && ans.has(key)) status2 = 'wrong'
                  else if (ck.has(key)) status2 = 'reveal-correct'
                  return <OptionItem key={key} optionKey={key} text={val} status={status2} disabled />
                })}
              </div>

              <div className="bg-muted border border-border border-l-[3px] border-l-muted-foreground rounded-lg p-3.5">
                <h4 className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-semibold">Giải thích</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  <strong>The Correct Answer:</strong> {[...ck].map(k => q.options[k]).join('; ')}.
                  {q.explanation && <> <ExplanationText text={q.explanation} /></>}
                  {wrongKeys.length > 0 && (
                    <> <strong>The Incorrect Answers:</strong> {wrongKeys.map(k => q.options[k]).join('; ')}.</>
                  )}
                </p>
              </div>

              {q.category && (
                <p className="text-sm text-muted-foreground border-t pt-2.5">
                  Lĩnh vực: {q.category}{q.subcategory ? ` / ${q.subcategory}` : ''}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
