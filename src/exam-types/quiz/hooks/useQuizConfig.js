import { useState } from 'react'

// Cấu hình trước khi làm bài: chủ đề/thứ tự/số câu, timer + thi thật, thời điểm chấm + thang điểm + tỉ lệ đậu.
// Thuần state + setter, không có logic nghiệp vụ — dùng chung bởi setup sidebar và quiz-session.
export function useQuizConfig(saved) {
  const [selectedCats, setSelectedCats] = useState(() => saved.selectedCats ?? [])
  const [mode, setMode] = useState(() => saved.mode ?? 'shuffle')
  const [useAll, setUseAll] = useState(() => saved.useAll ?? true)
  const [limit, setLimit] = useState(() => saved.limit ?? 20)

  const [timerEnabled, setTimerEnabled] = useState(() => saved.timerEnabled ?? false)
  const [timerMinutes, setTimerMinutes] = useState(() => saved.timerMinutes ?? 15)
  const [examMode, setExamMode] = useState(() => saved.examMode ?? false) // true = thi thật, không cho dừng, không xem đáp án giữa chừng

  const [revealMode, setRevealMode] = useState(() => saved.revealMode ?? 'instant') // 'instant' | 'end'
  const [scoreMode, setScoreMode] = useState(() => saved.scoreMode ?? 'count') // 'count' | 'point'
  const [pointMode, setPointMode] = useState(() => saved.pointMode ?? 'fixed') // 'fixed' | 'difficulty'
  const [customPoints, setCustomPoints] = useState(() => saved.customPoints ?? { easy: 1, medium: 2, hard: 3 })
  const [passPct, setPassPct] = useState(() => saved.passPct ?? 70)
  const [lockPrevious, setLockPrevious] = useState(() => saved.lockPrevious ?? false)

  const toggleCat = (cat) =>
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])

  return {
    selectedCats, setSelectedCats, toggleCat,
    mode, setMode, useAll, setUseAll, limit, setLimit,
    timerEnabled, setTimerEnabled, timerMinutes, setTimerMinutes, examMode, setExamMode,
    revealMode, setRevealMode, scoreMode, setScoreMode, pointMode, setPointMode,
    customPoints, setCustomPoints, passPct, setPassPct, lockPrevious, setLockPrevious,
  }
}
