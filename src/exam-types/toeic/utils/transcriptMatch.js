// Chấm % khớp giữa câu người học gõ lại và transcript gốc cho chế độ "Nghe & gõ lại" — khác
// isAnswerCorrect (dùng cho Từ vựng) là so khớp tuyệt đối cả cụm, ở đây câu dài hơn nên thiếu/sai
// 1-2 từ vẫn nên được tính gần đúng thay vì sai hoàn toàn. Tính bằng khoảng cách chỉnh sửa
// (Levenshtein) ở MỨC TỪ: số từ cần thêm/xoá/đổi để biến input thành câu gốc, rồi quy ra % khớp.
function normalizeWords(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function wordEditDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

// Trả về % khớp (0-100), làm tròn. Input/đáp án rỗng → 0%.
export function matchPercent(input, original) {
  const inputWords = normalizeWords(input)
  const originalWords = normalizeWords(original)
  if (!inputWords.length || !originalWords.length) return 0
  const distance = wordEditDistance(inputWords, originalWords)
  const pct = (1 - distance / originalWords.length) * 100
  return Math.max(0, Math.round(pct))
}

export function isMatchEnough(input, original, thresholdPct) {
  return matchPercent(input, original) >= thresholdPct
}
