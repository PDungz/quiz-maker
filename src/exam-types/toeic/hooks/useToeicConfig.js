import { useState } from 'react'

// Cấu hình trước khi làm bài TOEIC: Luyện tập (xem đáp án ngay, không giới hạn giờ) hoặc
// Thi thử (mô phỏng thi thật: timer, khoá câu trước, chỉ chấm sau khi nộp) + chọn Part muốn làm
// + cách hiển thị list câu hỏi (chia theo tab Part, hoặc cuộn chung tất cả không chia).
export function useToeicConfig(saved = {}) {
  // practiceMode quyết định cách chọn câu hỏi đưa vào đề: 'full' lọc theo Part (Làm đề, đúng cấu
  // trúc đề thi), 'topic' là Học — luyện riêng 1 phần, cách lọc tuỳ topicFilterBy.
  const [practiceMode, setPracticeMode] = useState(() => saved.practiceMode ?? 'topic') // 'topic' | 'full'
  // Chỉ áp dụng khi practiceMode = 'topic': lọc theo Part (phù hợp Listening, luyện riêng 1 dạng
  // như chỉ Part 2) hoặc theo tags chuyên đề ngữ pháp (phù hợp Reading, vd chỉ luyện "thì"). Chỉ
  // dùng 1 trong 2 tại 1 thời điểm, không cộng dồn — đơn giản hơn cho người học.
  const [topicFilterBy, setTopicFilterBy] = useState(() => saved.topicFilterBy ?? 'part') // 'part' | 'tag'
  const [examStyle, setExamStyle] = useState(() => saved.examStyle ?? 'practice') // 'practice' | 'test'
  const [selectedParts, setSelectedParts] = useState(() => saved.selectedParts ?? [])
  const [selectedTags, setSelectedTags] = useState(() => saved.selectedTags ?? [])
  const [timerMinutes, setTimerMinutes] = useState(() => saved.timerMinutes ?? 75)
  const [splitByPart, setSplitByPart] = useState(() => saved.splitByPart ?? true)
  // Chỉ áp dụng khi examStyle = 'practice': bật đồng hồ tham khảo, hết giờ KHÔNG tự nộp bài
  // (khác với Thi thử luôn bật timer và tự nộp khi hết giờ).
  const [practiceTimerEnabled, setPracticeTimerEnabled] = useState(() => saved.practiceTimerEnabled ?? false)
  // Chỉ áp dụng ở tab Học (practiceMode = 'topic') cho câu hỏi Listening (Part 1-4): 'choice' là
  // click chọn đáp án như thường, 'dictation' là nghe rồi gõ lại nguyên văn câu đã nghe để tự
  // chấm so với transcript — luyện nghe chép thay vì chỉ luyện chọn đáp án.
  const [listeningAnswerMode, setListeningAnswerMode] = useState(() => saved.listeningAnswerMode ?? 'choice') // 'choice' | 'dictation'
  // Độc lập với listeningAnswerMode, áp dụng cho CẢ 2 cách trả lời: ẩn nội dung câu hỏi (q.question)
  // và text đáp án của câu Listening (Part 1-4), giống đúng thi thật (chỉ nghe audio, không đọc
  // được gợi ý từ chữ trên màn hình). Ở chế độ chọn đáp án vẫn giữ nút A/B/C/D để bấm, chỉ ẩn text.
  const [hideListeningText, setHideListeningText] = useState(() => saved.hideListeningText ?? false)
  // Ngưỡng % số từ khớp để tính 1 dòng dictation là "đúng" (xem transcriptMatch.js) — gõ thiếu/sai
  // vài từ trong câu dài vẫn đạt nếu đủ ngưỡng, không bắt khớp tuyệt đối 100% như trước.
  const [dictationMatchThreshold, setDictationMatchThreshold] = useState(() => saved.dictationMatchThreshold ?? 80)

  // selectedParts/selectedTags rỗng nghĩa là "không lọc gì" = dùng tất cả. Bỏ chọn 1 item lúc
  // đang ở trạng thái đó phải khởi tạo lại thành "tất cả trừ item này", không phải chỉ thêm
  // đúng item đó vào — allItems là toàn bộ Part/tag thực sự có trong file đã nạp.
  const toggleInList = (setList, item, allItems = []) =>
    setList(prev => {
      const current = prev.length ? prev : allItems
      return current.includes(item) ? current.filter(x => x !== item) : [...current, item]
    })
  const togglePart = (part, allParts = []) => toggleInList(setSelectedParts, part, allParts)
  const toggleTag = (tag, allTags = []) => toggleInList(setSelectedTags, tag, allTags)

  return {
    practiceMode, setPracticeMode,
    topicFilterBy, setTopicFilterBy,
    examStyle, setExamStyle,
    selectedParts, setSelectedParts, togglePart,
    selectedTags, setSelectedTags, toggleTag,
    timerMinutes, setTimerMinutes,
    splitByPart, setSplitByPart,
    practiceTimerEnabled, setPracticeTimerEnabled,
    listeningAnswerMode, setListeningAnswerMode,
    hideListeningText, setHideListeningText,
    dictationMatchThreshold, setDictationMatchThreshold,
  }
}
