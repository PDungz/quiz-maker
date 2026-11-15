import { getPoint } from '../../../utils/quiz'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import OptionItem from '@/components/OptionItem'
import { ExplanationText } from '../../../features/results'

export default function ScrollView({
  questions, answers, revealed, revealMode, allDone, locked,
  scoreMode, pointMode, customPoints,
  toggleOptionAt, getOptionStatusAt, confirmAt, skipAt, onSubmit,
}) {
  const allAnswered = questions.every((_, i) => !!revealed[i])

  return (
    <div className="flex flex-col gap-3">
      {questions.map((q, i) => {
        const isMulti = q.type === 'multiple_choice'
        const sel = answers[i] ?? new Set()
        const answeredQ = !!revealed[i]
        const showAnswer = (revealMode === 'instant' && answeredQ) || allDone

        return (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3.5">
              <div className="flex gap-2 flex-wrap items-center">
                {q.category && <Badge variant="outline">{q.category}</Badge>}
                {q.difficulty && <Badge variant="secondary">{q.difficulty}</Badge>}
                {isMulti && <Badge variant="outline">Nhiều đáp án</Badge>}
                {scoreMode === 'point' && <Badge variant="secondary">{getPoint(q, pointMode, customPoints)} điểm</Badge>}
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

              {isMulti && !answeredQ && (
                <p className="text-sm text-muted-foreground px-3 py-1.5 bg-muted rounded-md inline-block w-fit">
                  Chọn tất cả đáp án đúng rồi bấm Xác nhận
                </p>
              )}

              <div className="flex flex-col gap-2">
                {Object.entries(q.options).map(([key, val]) => (
                  <OptionItem
                    key={key}
                    optionKey={key}
                    text={val}
                    status={getOptionStatusAt(i, key)}
                    disabled={answeredQ || locked}
                    onClick={() => toggleOptionAt(i, key)}
                  />
                ))}
              </div>

              {showAnswer && q.explanation && (
                <div className="bg-muted border border-border border-l-[3px] border-l-muted-foreground rounded-lg p-3.5">
                  <h4 className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-semibold">Giải thích</h4>
                  <ExplanationText text={q.explanation} className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed" />
                </div>
              )}

              {!locked && !answeredQ && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => skipAt(i)}>Bỏ qua</Button>
                  <Button onClick={() => confirmAt(i)} disabled={!sel.size}>Xác nhận</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {!locked && (
        <Button size="lg" className="w-full justify-center" onClick={onSubmit} disabled={!allAnswered}>
          {allAnswered ? 'Nộp bài 🏁' : `Còn ${questions.filter((_, i) => !revealed[i]).length} câu chưa trả lời`}
        </Button>
      )}
    </div>
  )
}
