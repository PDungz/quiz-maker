const DEFAULT_KEY = 'quiz-maker-session'

function replacer(_key, value) {
  if (value instanceof Set) return { __type: 'Set', values: [...value] }
  return value
}

function reviver(_key, value) {
  if (value && typeof value === 'object' && value.__type === 'Set') return new Set(value.values)
  return value
}

// key: cho phép mỗi exam-type lưu session riêng (Quiz/TOEIC/IELTS), tránh đè lẫn nhau.
// Mặc định giữ nguyên key cũ của Quiz để không phá session đã lưu từ trước.
export function saveSession(data, key = DEFAULT_KEY) {
  try {
    localStorage.setItem(key, JSON.stringify(data, replacer))
  } catch {
    // localStorage đầy hoặc bị chặn — bỏ qua, không làm vỡ app
  }
}

export function loadSession(key = DEFAULT_KEY) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw, reviver)
  } catch {
    return null
  }
}

export function clearSession(key = DEFAULT_KEY) {
  try {
    localStorage.removeItem(key)
  } catch {
    // bỏ qua
  }
}
