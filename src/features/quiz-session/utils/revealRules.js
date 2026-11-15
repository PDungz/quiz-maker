// Hàm thuần quyết định khi nào đáp án/kết quả được hiển thị trong 1 lượt làm bài.
// Tách riêng khỏi useQuizSession để dễ thay bằng bộ rule khác khi thêm loại đề thi mới
// (ví dụ TOEIC có thể luôn ẩn đáp án theo từng part thay vì theo examMode của quiz thường).

// Chế độ thi thật ép chấm điểm về cuối bài, không cho xem đáp án/kết quả từng câu khi đang làm
export function getEffectiveRevealMode(revealMode, examMode) {
  return examMode ? 'end' : revealMode
}

export function canShowAnswer(effectiveRevealMode, answered, allDone) {
  return (effectiveRevealMode === 'instant' && answered) || allDone
}

export function canToggleOption({ effectiveRevealMode, wasAnswered, lockPrevious, locked }) {
  if (effectiveRevealMode === 'instant' && wasAnswered) return false
  if (lockPrevious && wasAnswered) return false
  if (locked) return false
  return true
}

export function shouldAdvanceAfterAnswer(effectiveRevealMode, viewMode) {
  return effectiveRevealMode === 'end' && viewMode === 'single'
}

// Trạng thái hiển thị của 1 đáp án: 'selected' | 'correct' | 'wrong' | 'reveal-correct' | 'none'.
// Trả về trạng thái thuần, không phải class CSS — UI tự map sang màu/class của hệ thống style đang dùng.
export function getOptionStatus({ key, ans, correctSet, showAnswer }) {
  if (!showAnswer) return ans.has(key) ? 'selected' : 'none'
  if (correctSet.has(key) && ans.has(key)) return 'correct'
  if (!correctSet.has(key) && ans.has(key)) return 'wrong'
  if (correctSet.has(key)) return 'reveal-correct'
  return 'none'
}

// Dùng cho nav-dots: câu đã trả lời có nên tô màu đúng/sai ngay không, hay chỉ tô "đã trả lời" (chờ chấm)
export function canShowNavDotResult(effectiveRevealMode, wasAnswered, allDone) {
  return wasAnswered && (effectiveRevealMode === 'instant' || allDone)
}
