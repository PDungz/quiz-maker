import { isCorrect, getPoint } from '../../../utils/quiz'

// Tính điểm/kết quả tổng của 1 lượt làm bài, theo cách đếm số câu đúng hoặc theo thang điểm (point).
// Tách thành hàm thuần để results/ và quiz-session/ dùng chung, và để loại đề thi khác (TOEIC thang
// 5-495, IELTS band 0-9) có thể cắm thêm cách tính riêng ở đây sau này mà không đụng vào UI.
// Giả định: chỉ gọi trên 1 lượt làm bài đã hoàn thành (allDone), nên mọi câu đều coi là "đã chốt" rồi.
export function computeScoring({ questions, answers, scoreMode, pointMode, customPoints, passPct }) {
  const totalCorrect = questions.filter((qq, i) => isCorrect(qq, answers[i])).length
  const totalSkipped = questions.filter((_, i) => !(answers[i]?.size)).length

  const maxPoint = questions.reduce((sum, qq) => sum + getPoint(qq, pointMode, customPoints), 0)
  const earnedPoint = questions.reduce((sum, qq, i) => sum + (isCorrect(qq, answers[i]) ? getPoint(qq, pointMode, customPoints) : 0), 0)

  const pctCount = questions.length ? Math.round((totalCorrect / questions.length) * 100) : 0
  const pctPoint = maxPoint ? Math.round((earnedPoint / maxPoint) * 100) : 0
  const pct = scoreMode === 'point' ? pctPoint : pctCount
  const passed = pct >= passPct

  return { totalCorrect, totalSkipped, maxPoint, earnedPoint, pct, passed }
}
