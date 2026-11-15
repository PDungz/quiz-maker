import { useState } from 'react'

// Cấu hình trước khi làm bài TOEIC: Luyện tập (xem đáp án ngay, không giới hạn giờ) hoặc
// Thi thử (mô phỏng thi thật: timer, khoá câu trước, chỉ chấm sau khi nộp) + chọn Part muốn làm
// + cách hiển thị list câu hỏi (chia theo tab Part, hoặc cuộn chung tất cả không chia).
export function useToeicConfig(saved = {}) {
  const [examStyle, setExamStyle] = useState(() => saved.examStyle ?? 'practice') // 'practice' | 'test'
  const [selectedParts, setSelectedParts] = useState(() => saved.selectedParts ?? [])
  const [timerMinutes, setTimerMinutes] = useState(() => saved.timerMinutes ?? 75)
  const [splitByPart, setSplitByPart] = useState(() => saved.splitByPart ?? true)
  // Chỉ áp dụng khi examStyle = 'practice': bật đồng hồ tham khảo, hết giờ KHÔNG tự nộp bài
  // (khác với Thi thử luôn bật timer và tự nộp khi hết giờ).
  const [practiceTimerEnabled, setPracticeTimerEnabled] = useState(() => saved.practiceTimerEnabled ?? false)

  // selectedParts rỗng nghĩa là "không lọc gì" = dùng tất cả Part. Bỏ chọn 1 Part lúc đang ở
  // trạng thái đó phải khởi tạo lại thành "tất cả Part trừ part này", không phải chỉ thêm đúng
  // part đó vào — allParts là toàn bộ Part thực sự có trong file đã nạp.
  const togglePart = (part, allParts = []) =>
    setSelectedParts(prev => {
      const current = prev.length ? prev : allParts
      return current.includes(part) ? current.filter(p => p !== part) : [...current, part]
    })

  return {
    examStyle, setExamStyle,
    selectedParts, setSelectedParts, togglePart,
    timerMinutes, setTimerMinutes,
    splitByPart, setSplitByPart,
    practiceTimerEnabled, setPracticeTimerEnabled,
  }
}
