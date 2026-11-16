import { formatDuration } from '../../../utils/quiz'

// Giống utils/export.js's buildProgressMarkdown/parseProgressSnapshot, nhưng khớp đúng cấu hình
// riêng của TOEIC (examStyle, selectedParts) thay vì cấu hình Quiz (mode/useAll/limit/lockPrevious).
// buildExportMarkdown/parseExportSnapshot/buildResultSnapshot của Quiz đã đủ generic (chỉ cần
// questions/answers/scoreMode...) nên TOEIC tái dùng thẳng, không cần viết lại.
export function buildToeicProgressMarkdown(opts) {
  const {
    questions, answers, revealed,
    sourceNames, practiceMode, topicFilterBy, examStyle, selectedParts, selectedTags, timerMinutes, practiceTimerEnabled,
    secondsLeft, timerStarted, timerPaused,
    startedAt, pausedMs,
  } = opts
  const now = new Date()
  const answeredCount = questions.filter((_, i) => !!revealed[i]).length
  const timerActive = examStyle === 'test' || practiceTimerEnabled

  const lines = []
  lines.push(`# Bài TOEIC đang làm dở — Quiz Maker`)
  lines.push('')
  if (sourceNames?.length) lines.push(`File nguồn: ${sourceNames.join(', ')}`)
  lines.push(`Lưu lúc: ${now.toLocaleString('vi-VN')}`)
  lines.push(`Tiến độ: ${answeredCount}/${questions.length} câu đã trả lời`)
  if (timerActive) lines.push(`Thời gian còn lại: ${formatDuration(secondsLeft)} / giới hạn ${timerMinutes} phút`)
  lines.push('')
  lines.push('File này dùng để nạp lại và làm tiếp — không phải file kết quả. Mở qua nút "📥 Mở bài đang làm dở" trong app.')
  lines.push('')
  lines.push('---')
  lines.push('')

  const snapshot = {
    kind: 'toeic-progress',
    savedAt: now.toISOString(),
    sourceNames: sourceNames ?? [],
    questions,
    answers: questions.map((_, i) => [...(answers[i] ?? new Set())]),
    revealed,
    practiceMode, topicFilterBy, examStyle, selectedParts, selectedTags, practiceTimerEnabled: !!practiceTimerEnabled,
    timerMinutes,
    secondsLeft, timerStarted: !!timerStarted, timerPaused: !!timerPaused,
    startedAt: startedAt ?? null, pausedMs: pausedMs ?? 0,
  }
  lines.push(`<!-- QUIZ_MAKER_DATA\n${JSON.stringify(snapshot)}\n-->`)

  return { content: lines.join('\n'), now }
}

export function parseToeicProgressSnapshot(text) {
  const match = text.match(/<!-- QUIZ_MAKER_DATA\n([\s\S]*?)\n-->/)
  if (!match) return null
  try {
    const snapshot = JSON.parse(match[1])
    if (snapshot.kind !== 'toeic-progress') return null
    const answers = {}
    snapshot.answers.forEach((keys, i) => { answers[i] = new Set(keys) })
    return { ...snapshot, answers }
  } catch {
    return null
  }
}
