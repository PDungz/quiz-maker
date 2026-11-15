import { useState, useEffect } from 'react'

// Đồng hồ đếm ngược cho 1 lượt làm bài: start/pause, tích luỹ thời gian dừng, tự nộp khi hết giờ.
export function useTimer({ saved, timerEnabled, timerMinutes, submitted, onTimeUp }) {
  const [timerStarted, setTimerStarted] = useState(() => saved.timerStarted ?? false)
  const [timerPaused, setTimerPaused] = useState(() => saved.timerPaused ?? false)
  const [secondsLeft, setSecondsLeft] = useState(() => saved.secondsLeft ?? 0)
  const [timeUp, setTimeUp] = useState(false)
  const [startedAt, setStartedAt] = useState(() => saved.startedAt ?? null)
  const [elapsedSeconds, setElapsedSeconds] = useState(() => saved.elapsedSeconds ?? null)
  const [pausedMs, setPausedMs] = useState(() => saved.pausedMs ?? 0)
  const [pauseStartedAt, setPauseStartedAt] = useState(() => saved.timerPaused && saved.pauseStartedAt != null ? Date.now() : null)

  const startTimer = () => {
    setTimerStarted(true); setTimerPaused(false)
    setStartedAt(Date.now())
  }

  const togglePause = () => {
    setTimerPaused(p => {
      const next = !p
      if (next) {
        setPauseStartedAt(Date.now())
      } else {
        setPauseStartedAt(cur => {
          if (cur) setPausedMs(ms => ms + (Date.now() - cur))
          return null
        })
      }
      return next
    })
  }

  const resetTimer = () => {
    setTimerStarted(false); setTimerPaused(false); setTimeUp(false); setSecondsLeft(0)
    setStartedAt(null); setElapsedSeconds(null); setPausedMs(0); setPauseStartedAt(null)
  }

  const armTimer = () => {
    setTimerStarted(false); setTimerPaused(false); setTimeUp(false)
    setSecondsLeft(timerEnabled ? timerMinutes * 60 : 0)
    setStartedAt(timerEnabled ? null : Date.now())
    setElapsedSeconds(null); setPausedMs(0); setPauseStartedAt(null)
  }

  const finalizeElapsed = () => {
    const now = Date.now()
    const openPauseMs = pauseStartedAt ? now - pauseStartedAt : 0
    setElapsedSeconds(startedAt ? Math.max(0, Math.round((now - startedAt - pausedMs - openPauseMs) / 1000)) : null)
  }

  const pausedMsAtNow = () => pauseStartedAt ? pausedMs + (Date.now() - pauseStartedAt) : pausedMs

  // ── Countdown tick ──
  useEffect(() => {
    if (!timerEnabled || !timerStarted || timerPaused || timeUp || submitted || secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timerEnabled, timerStarted, timerPaused, timeUp, submitted, secondsLeft])

  // ── Time's up → auto-submit ──
  useEffect(() => {
    if (!timerEnabled || !timerStarted || timeUp || submitted || secondsLeft > 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external countdown timer finishing
    setTimeUp(true)
    onTimeUp()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onTimeUp is stable per-render and intentionally omitted to avoid re-running on every answer change
  }, [timerEnabled, timerStarted, timeUp, submitted, secondsLeft])

  return {
    timerStarted, setTimerStarted, timerPaused, setTimerPaused, secondsLeft, setSecondsLeft, timeUp, setTimeUp,
    startedAt, setStartedAt, elapsedSeconds, setElapsedSeconds, pausedMs, setPausedMs, pauseStartedAt, setPauseStartedAt,
    startTimer, togglePause, resetTimer, armTimer, finalizeElapsed, pausedMsAtNow,
  }
}
