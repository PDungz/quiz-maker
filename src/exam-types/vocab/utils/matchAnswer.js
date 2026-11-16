// Chấm đúng/sai cho chế độ gõ tay: chuẩn hoá cả input và đáp án đúng (lowercase, bỏ dấu câu,
// gộp khoảng trắng liên tiếp), rồi coi là đúng nếu input khớp 1 trong các cụm được tách bởi dấu
// phẩy/chấm phẩy của đáp án — meaning trong .md thường liệt kê nhiều cách diễn đạt cách nhau bởi
// dấu phẩy (vd "kiên cường, dẻo dai"), nên chỉ cần khớp đúng 1 cụm là đủ, không cần gõ hết.
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isAnswerCorrect(input, correctAnswer) {
  const normalizedInput = normalize(input)
  if (!normalizedInput) return false
  const parts = correctAnswer.split(/[,;]/).map(normalize).filter(Boolean)
  return parts.includes(normalizedInput)
}
