import { useState, useEffect } from 'react'
import { createInitialProgress, reviewCard, isDue } from '../utils/sm2'

const STORAGE_KEY = 'vocab-srs-progress'

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAll(progressById) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressById))
  } catch {
    // localStorage đầy hoặc bị chặn — bỏ qua, không làm vỡ app
  }
}

// Tiến độ SRS của toàn bộ thẻ, khoá theo cardId — tách biệt khỏi nội dung thẻ (word/meaning...)
// nên re-import cùng 1 file .md không bao giờ làm mất tiến độ đã học, chỉ mất khi người dùng
// chủ động xoá bộ từ. Mỗi đổi đều lưu ngay vào localStorage (persist lâu dài, không như audio
// object URL — đây là dữ liệu số thuần, serialize JSON an toàn).
export function useSrsProgress() {
  const [progressById, setProgressById] = useState(() => loadAll())

  useEffect(() => {
    saveAll(progressById)
  }, [progressById])

  const getProgress = (cardId) => progressById[cardId] ?? createInitialProgress(cardId)

  // Đảm bảo mọi cardId trong bộ thẻ đang học đều có progress — gọi khi nạp thêm thẻ mới.
  const ensureProgress = (cardIds) => {
    setProgressById(prev => {
      const next = { ...prev }
      let changed = false
      cardIds.forEach(id => {
        if (!next[id]) { next[id] = createInitialProgress(id); changed = true }
      })
      return changed ? next : prev
    })
  }

  // Trả về progress mới ngay (không chỉ cập nhật state) để nơi gọi (vd ghi log xuất kết quả)
  // biết được lần ôn tiếp theo là khi nào mà không phải đợi re-render đọc lại progressById.
  const review = (cardId, quality) => {
    const current = progressById[cardId] ?? createInitialProgress(cardId)
    const next = reviewCard(current, quality)
    setProgressById(prev => ({ ...prev, [cardId]: next }))
    return next
  }

  const getDueCardIds = (cardIds, now = new Date()) =>
    cardIds.filter(id => isDue(progressById[id] ?? createInitialProgress(id), now))

  const resetProgress = (cardIds) => {
    setProgressById(prev => {
      const next = { ...prev }
      cardIds.forEach(id => { delete next[id] })
      return next
    })
  }

  return { progressById, getProgress, ensureProgress, review, getDueCardIds, resetProgress }
}
