// SM-2 đơn giản hoá (kiểu Anki): mỗi thẻ có easeFactor (hệ số dễ/khó) và intervalDays (số ngày
// đến lần ôn tiếp theo). Sau khi lật thẻ, người học tự đánh giá mức nhớ — app tính lại interval
// và easeFactor theo công thức SM-2 gốc, quy đổi quality 0-5 gốc thành 4 mức cho gọn.

export const QUALITY = {
  FORGOT: 0, // Quên hẳn — không nhớ gì
  HARD: 3, // Nhớ được nhưng rất khó, phải suy nghĩ lâu
  GOOD: 4, // Nhớ đúng, bình thường
  EASY: 5, // Nhớ ngay, rất dễ
}

const MIN_EASE_FACTOR = 1.3
const DEFAULT_EASE_FACTOR = 2.5

export function createInitialProgress(cardId) {
  return {
    cardId,
    easeFactor: DEFAULT_EASE_FACTOR,
    intervalDays: 0,
    repetitions: 0,
    dueAt: new Date().toISOString(),
    lastReviewedAt: null,
  }
}

// Áp dụng 1 lượt đánh giá (quality) lên progress hiện tại, trả về progress mới — hàm thuần,
// không side-effect, để dễ test độc lập khỏi mọi state/storage.
export function reviewCard(progress, quality, now = new Date()) {
  const wasCorrect = quality >= QUALITY.HARD

  let { easeFactor, intervalDays, repetitions } = progress

  // Công thức easeFactor gốc SM-2: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
  const nextEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  if (!wasCorrect) {
    // Quên: reset chu kỳ, ôn lại sớm (10 phút) nhưng không phạt easeFactor quá nặng
    return {
      ...progress,
      easeFactor: nextEaseFactor,
      intervalDays: 0,
      repetitions: 0,
      dueAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
      lastReviewedAt: now.toISOString(),
    }
  }

  let nextInterval
  if (repetitions === 0) nextInterval = 1
  else if (repetitions === 1) nextInterval = 6
  else nextInterval = Math.round(intervalDays * nextEaseFactor)

  return {
    ...progress,
    easeFactor: nextEaseFactor,
    intervalDays: nextInterval,
    repetitions: repetitions + 1,
    dueAt: new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000).toISOString(),
    lastReviewedAt: now.toISOString(),
  }
}

export function isDue(progress, now = new Date()) {
  if (!progress.dueAt) return true
  return new Date(progress.dueAt).getTime() <= now.getTime()
}
