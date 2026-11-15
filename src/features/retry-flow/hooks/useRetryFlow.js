import { useState } from 'react'

// Luồng "làm lại": pool câu đang chờ cấu hình lại, kết quả trước đó để xem lại,
// và việc hỏi xác nhận xuất file trước khi làm lại nếu chưa xuất.
export function useRetryFlow(saved) {
  const [retryPool, setRetryPool] = useState(() => saved.retryPool ?? null) // mảng câu hỏi đang chờ cấu hình lại để làm lại
  const [previousResult, setPreviousResult] = useState(null) // snapshot kết quả trước khi bấm Làm lại, để xem lại
  const [hasExported, setHasExported] = useState(false) // đã xuất file cho kết quả hiện tại chưa
  const [pendingRetrySubset, setPendingRetrySubset] = useState(null) // chờ xác nhận xuất file trước khi làm lại
  const [pendingRetrySourceSnapshot, setPendingRetrySourceSnapshot] = useState(null) // snapshot nguồn đi kèm pendingRetrySubset, nếu retry bắt đầu từ trang xem kết quả đã lưu/trước đó
  const [showPreviousResult, setShowPreviousResult] = useState(false)

  const clearPendingRetry = () => { setPendingRetrySubset(null); setPendingRetrySourceSnapshot(null) }

  const resetRetryFlow = () => {
    setRetryPool(null); setHasExported(false); setPreviousResult(null); setShowPreviousResult(false)
  }

  return {
    retryPool, setRetryPool,
    previousResult, setPreviousResult,
    hasExported, setHasExported,
    pendingRetrySubset, setPendingRetrySubset,
    pendingRetrySourceSnapshot, setPendingRetrySourceSnapshot,
    showPreviousResult, setShowPreviousResult,
    clearPendingRetry, resetRetryFlow,
  }
}
