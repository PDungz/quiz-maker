export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getPoint(q, pointMode, customPoints) {
  if (q.point !== null && q.point !== undefined && !Number.isNaN(q.point)) return q.point
  if (pointMode === 'difficulty') return customPoints[q.difficulty] ?? 1
  return 1
}

export function isCorrect(q, ans) {
  const ck = new Set(q.correct_answer)
  return ans && ans.size > 0 && ans.size === ck.size && [...ans].every(k => ck.has(k))
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDuration(sec) {
  if (sec == null) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m === 0) return `${s} giây`
  if (s === 0) return `${m} phút`
  return `${m} phút ${s} giây`
}
