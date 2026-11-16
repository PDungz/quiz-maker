import { useState } from 'react'

export const EXAM_TYPES = [
  { key: 'quiz', label: 'QUIZ' },
  { key: 'toeic', label: 'TOEIC' },
  { key: 'vocab', label: 'TỪ VỰNG' },
  // { key: 'ielts', label: 'IELTS' },
]

// Loại đề thi đang được chọn trên menu đầu trang. Chỉ ảnh hưởng tới UI hiển thị câu hỏi
// và form cấu hình (xem exam-types/<loại>/) — các luồng chung (file-library, quiz-session,
// results, retry-flow) không quan tâm giá trị này.
export function useActiveExamType() {
  const [activeExamType, setActiveExamType] = useState('quiz')
  return { activeExamType, setActiveExamType }
}
