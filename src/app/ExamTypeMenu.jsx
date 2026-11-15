import { EXAM_TYPES } from './useActiveExamType'
import { Button } from '@/components/ui/button'

export default function ExamTypeMenu({ activeExamType, onChange }) {
  return (
    <nav className="flex gap-3 bg-muted border rounded-lg">
      {EXAM_TYPES.map(t => (
        <Button
          key={t.key}
          variant={activeExamType === t.key ? 'default' : 'secondary'}
          size="sm"
          className="h-8 w-20 px-0 text-xs font-bold tracking-wide"
          onClick={() => onChange(t.key)}
        >{t.label}</Button>
      ))}
    </nav>
  )
}
