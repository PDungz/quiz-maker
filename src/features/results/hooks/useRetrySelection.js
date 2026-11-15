import { useState } from 'react'

// Chọn nhiều câu (từng câu + theo tab filter cộng dồn) để "làm lại", dùng ở màn xem kết quả.
export function useRetrySelection() {
  const [retrySelection, setRetrySelection] = useState(() => new Set())

  const toggleRetrySelect = (i) => {
    setRetrySelection(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const selectManyRetry = (indices, select) => {
    setRetrySelection(prev => {
      const next = new Set(prev)
      indices.forEach(i => select ? next.add(i) : next.delete(i))
      return next
    })
  }

  return { retrySelection, setRetrySelection, toggleRetrySelect, selectManyRetry }
}
