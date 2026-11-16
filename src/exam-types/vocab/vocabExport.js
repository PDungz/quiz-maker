const QUALITY_LABEL = {
  forgot: 'Quên',
  hard: 'Khó',
  good: 'Bình thường',
  easy: 'Dễ',
}

function formatInterval(progress) {
  if (progress.intervalDays === 0) return 'ôn lại sau 10 phút'
  if (progress.intervalDays === 1) return 'ôn lại sau 1 ngày'
  return `ôn lại sau ${progress.intervalDays} ngày`
}

// synonyms/antonyms là object { word, partOfSpeech, meaning } (xem vocabParser.js) — gộp lại
// thành 1 dòng text ngắn cho dễ đọc trong file xuất, vd "determine (verb): xác định".
function formatRelatedWord(item) {
  const parts = [item.word]
  if (item.partOfSpeech) parts[0] += ` (${item.partOfSpeech})`
  if (item.meaning) parts.push(item.meaning)
  return parts.join(': ')
}

// Xuất tổng kết 1 lượt ôn từ vựng ra file .md: từng thẻ đã ôn + mức tự đánh giá + lần ôn tiếp
// theo SRS — khác hẳn buildExportMarkdown của Quiz/TOEIC (không có đúng/sai, chỉ có tự đánh giá
// mức nhớ), nên viết hàm riêng thay vì ép dùng chung.
export function buildVocabResultMarkdown(reviewLog, sourceNames) {
  const now = new Date()
  const counts = reviewLog.reduce((acc, r) => {
    acc[r.quality] = (acc[r.quality] ?? 0) + 1
    return acc
  }, {})

  const lines = []
  lines.push('# Kết quả ôn từ vựng — Quiz Maker')
  lines.push('')
  if (sourceNames?.length) lines.push(`File nguồn: ${sourceNames.join(', ')}`)
  lines.push(`Ngày ôn: ${now.toLocaleString('vi-VN')}`)
  lines.push(`Tổng cộng: ${reviewLog.length} thẻ — ${Object.entries(counts).map(([q, n]) => `${n} ${QUALITY_LABEL[q]}`).join(', ')}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  reviewLog.forEach(({ card, quality, progress }) => {
    lines.push(`## ${card.word}${card.partOfSpeech ? ` (${card.partOfSpeech})` : ''}`)
    lines.push('')
    if (card.pronunciation) lines.push(`- Phiên âm: ${card.pronunciation}`)
    lines.push(`- Nghĩa: ${card.meaning}`)
    if (card.example) lines.push(`- Ví dụ: ${card.example}`)
    if (card.wordFamily?.length) lines.push(`- Họ từ cùng gốc: ${card.wordFamily.join(', ')}`)
    if (card.synonyms?.length) lines.push(`- Đồng nghĩa: ${card.synonyms.map(formatRelatedWord).join(', ')}`)
    if (card.antonyms?.length) lines.push(`- Đối nghĩa: ${card.antonyms.map(formatRelatedWord).join(', ')}`)
    if (card.collocations?.length) lines.push(`- Cụm cố định: ${card.collocations.join(', ')}`)
    lines.push(`- Đánh giá: **${QUALITY_LABEL[quality]}**`)
    lines.push(`- Lần ôn tiếp theo: ${formatInterval(progress)}`)
    lines.push('')
  })

  return { content: lines.join('\n'), now }
}
