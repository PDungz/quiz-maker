import { useState } from 'react'
import {
  getEffectiveRevealMode, canShowAnswer, canToggleOption, shouldAdvanceAfterAnswer, getOptionStatus,
} from '../utils/revealRules'

// State lõi của 1 lượt làm bài: câu hỏi, đáp án đã chọn, câu đã "chốt", vị trí hiện tại, đã nộp hay chưa.
// Logic quyết định khi nào hiện đáp án/được sửa lại nằm ở utils/revealRules.js — hook này chỉ giữ state
// và gọi xuống đó, không tự định nghĩa rule.
export function useQuizSession({ saved, revealMode, examMode, lockPrevious, viewMode }) {
  const [questions, setQuestions] = useState(() => saved.questions ?? [])
  const [answers, setAnswers] = useState(() => saved.answers ?? {})
  const [revealed, setRevealed] = useState(() => saved.revealed ?? {})
  const [current, setCurrent] = useState(() => saved.current ?? 0)
  const [submitted, setSubmitted] = useState(() => saved.submitted ?? false)

  const allDone = questions.length > 0 && submitted
  const effectiveRevealMode = getEffectiveRevealMode(revealMode, examMode)
  const locked = submitted

  const toggleOptionAt = (idx, key, { timeUp } = {}) => {
    const qq = questions[idx]
    const isMultiQ = qq?.type === 'multiple_choice'
    const wasAnswered = !!revealed[idx]
    if (!canToggleOption({ effectiveRevealMode, wasAnswered, lockPrevious, locked: locked || !!timeUp })) return
    setAnswers(prev => {
      const s = new Set(prev[idx] ?? [])
      if (isMultiQ) { s.has(key) ? s.delete(key) : s.add(key) } else { s.clear(); s.add(key) }
      return { ...prev, [idx]: s }
    })
  }

  const confirmAt = (idx, { timeUp } = {}) => {
    const ans = answers[idx] ?? new Set()
    if (!ans.size || locked || timeUp) return
    setRevealed(prev => ({ ...prev, [idx]: true }))
    if (shouldAdvanceAfterAnswer(effectiveRevealMode, viewMode) && idx < questions.length - 1) setCurrent(c => c + 1)
  }

  const skipAt = (idx, { timeUp } = {}) => {
    if (locked || timeUp) return
    setRevealed(prev => ({ ...prev, [idx]: true }))
    if (shouldAdvanceAfterAnswer(effectiveRevealMode, viewMode) && idx < questions.length - 1) setCurrent(c => c + 1)
  }

  const getOptionStatusAt = (idx, key) => {
    const qq = questions[idx]
    const ansIdx = answers[idx] ?? new Set()
    const ckIdx = qq ? new Set(qq.correct_answer) : new Set()
    const answeredIdx = !!revealed[idx]
    const showAnswerIdx = canShowAnswer(effectiveRevealMode, answeredIdx, allDone)
    return getOptionStatus({ key, ans: ansIdx, correctSet: ckIdx, showAnswer: showAnswerIdx })
  }

  const resetSession = () => {
    setQuestions([]); setAnswers({}); setRevealed({}); setCurrent(0); setSubmitted(false)
  }

  const finalizeSubmit = () => {
    setSubmitted(true)
    setRevealed(prev => {
      const next = { ...prev }
      questions.forEach((_, i) => { if (!next[i]) next[i] = true })
      return next
    })
  }

  return {
    questions, setQuestions, answers, setAnswers, revealed, setRevealed, current, setCurrent, submitted, setSubmitted,
    allDone, effectiveRevealMode, locked,
    toggleOptionAt, confirmAt, skipAt, getOptionStatusAt, resetSession, finalizeSubmit,
  }
}
