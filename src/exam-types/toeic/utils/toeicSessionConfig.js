// Suy ra toàn bộ cấu hình của 1 lượt làm bài TOEIC từ lựa chọn examStyle của người dùng, gom về
// 1 chỗ duy nhất thay vì rải điều kiện ba ngôi (examMode ? ... : ...) khắp ToeicPage.jsx.
// Thêm hình thức mới (ví dụ "ôn tập theo lỗi sai") chỉ cần thêm 1 case ở đây.
//
// timerEnabled và autoSubmitOnTimeUp tách riêng: Thi thử luôn bật cả 2 (mô phỏng thi thật, hết
// giờ tự nộp). Luyện tập có thể bật timer theo lựa chọn riêng (practiceTimerEnabled) nhưng CHỈ
// để tham khảo — hết giờ không tự nộp, không khoá bài, vẫn làm tiếp được bình thường.
const SESSION_CONFIG_BY_STYLE = {
  practice: (practiceTimerEnabled) => ({
    examMode: false,
    revealMode: 'instant', // xem đáp án ngay sau khi xác nhận từng câu
    lockPrevious: false, // được quay lại sửa câu đã làm
    timerEnabled: practiceTimerEnabled,
    autoSubmitOnTimeUp: false,
  }),
  test: () => ({
    examMode: true,
    revealMode: 'end', // chỉ chấm điểm sau khi nộp toàn bài
    lockPrevious: true, // không được sửa lại câu đã làm, mô phỏng thi thật
    timerEnabled: true,
    autoSubmitOnTimeUp: true,
  }),
}

export function getToeicSessionConfig(examStyle, practiceTimerEnabled) {
  const build = SESSION_CONFIG_BY_STYLE[examStyle] ?? SESSION_CONFIG_BY_STYLE.practice
  return build(practiceTimerEnabled)
}
