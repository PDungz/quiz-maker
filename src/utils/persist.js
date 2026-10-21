const STORAGE_KEY = 'quiz-maker-session'

function replacer(_key, value) {
  if (value instanceof Set) return { __type: 'Set', values: [...value] }
  return value
}

function reviver(_key, value) {
  if (value && typeof value === 'object' && value.__type === 'Set') return new Set(value.values)
  return value
}

export function saveSession(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data, replacer))
  } catch {
    // localStorage đầy hoặc bị chặn — bỏ qua, không làm vỡ app
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw, reviver)
  } catch {
    return null
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // bỏ qua
  }
}
