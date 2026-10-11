import { getPoint, isCorrect, formatDuration } from './quiz'

export function slugifyFilename(name) {
  return name
    .replace(/\.md$/i, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'quiz'
}

export function formatTimestampForFilename(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`
}

export function buildExportMarkdown(questions, answers, scoreMode, pointMode, customPoints, pct, passed, passPct, sourceNames, elapsedSeconds, timerEnabled, timerMinutes) {
  const now = new Date()
  const lines = []
  lines.push(`# Kết quả bài làm — Quiz Maker`)
  lines.push('')
  if (sourceNames?.length) lines.push(`File nguồn: ${sourceNames.join(', ')}`)
  lines.push(`Ngày làm: ${now.toLocaleString('vi-VN')}`)
  lines.push(`Điểm: ${pct}% — ${passed ? 'Đạt' : 'Không đạt'} (ngưỡng ${passPct}%)`)
  if (elapsedSeconds != null) {
    lines.push(`Thời gian làm: ${formatDuration(elapsedSeconds)}${timerEnabled ? ` / giới hạn ${timerMinutes} phút` : ''}`)
  }
  if (scoreMode === 'point') {
    const maxPoint = questions.reduce((sum, qq) => sum + getPoint(qq, pointMode, customPoints), 0)
    const earnedPoint = questions.reduce((sum, qq, i) => sum + (isCorrect(qq, answers[i]) ? getPoint(qq, pointMode, customPoints) : 0), 0)
    lines.push(`Thang điểm: ${earnedPoint} / ${maxPoint} điểm`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')

  questions.forEach((q, i) => {
    const ans = answers[i] ?? new Set()
    const ck = new Set(q.correct_answer)
    const isSkipped = !ans.size
    const ok = !isSkipped && isCorrect(q, ans)
    const status = isSkipped ? 'Bỏ qua' : ok ? 'Đúng' : 'Sai'

    lines.push(`## Câu ${i + 1}: ${q.question}`)
    lines.push('')
    if (q.code) {
      lines.push('```' + (q.code_lang || ''))
      lines.push(q.code)
      lines.push('```')
      lines.push('')
    }
    lines.push(`**Kết quả: ${status}**`)
    if (!isSkipped) lines.push(`- Bạn chọn: ${[...ans].map(k => `${k}. ${q.options[k] ?? ''}`).join('; ')}`)
    lines.push(`- Đáp án đúng: ${[...ck].map(k => `${k}. ${q.options[k] ?? ''}`).join('; ')}`)
    lines.push('')
    lines.push('Giải thích')
    const explanationParts = []
    if (q.explanation) explanationParts.push(q.explanation)
    explanationParts.push(`Đáp án đúng: ${[...ck].map(k => `${q.options[k] ?? ''}`).join(', ')}.`)
    const wrongKeys = Object.keys(q.options).filter(k => !ck.has(k))
    if (wrongKeys.length) explanationParts.push(`Đáp án sai: ${wrongKeys.map(k => q.options[k]).join(', ')}.`)
    lines.push(explanationParts.join(' '))
    lines.push('')
    if (q.category) lines.push(`Lĩnh vực: ${q.category}${q.subcategory ? ' / ' + q.subcategory : ''}`)
    lines.push('')
    lines.push('---')
    lines.push('')
  })

  const snapshot = {
    savedAt: now.toISOString(),
    sourceNames: sourceNames ?? [],
    scoreMode, pointMode, customPoints, pct, passed, passPct,
    elapsedSeconds: elapsedSeconds ?? null, timerEnabled: !!timerEnabled, timerMinutes: timerMinutes ?? null,
    questions,
    answers: questions.map((_, i) => [...(answers[i] ?? new Set())]),
  }
  lines.push(`<!-- QUIZ_MAKER_DATA\n${JSON.stringify(snapshot)}\n-->`)

  return { content: lines.join('\n'), now }
}

export function parseExportSnapshot(text) {
  const match = text.match(/<!-- QUIZ_MAKER_DATA\n([\s\S]*?)\n-->/)
  if (!match) return null
  try {
    const snapshot = JSON.parse(match[1])
    const answers = {}
    snapshot.answers.forEach((keys, i) => { answers[i] = new Set(keys) })
    return { ...snapshot, answers }
  } catch {
    return null
  }
}

export function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
