import { useState, useEffect } from 'react'
import { getInitialTheme } from './utils/theme'
import AppShell from './app/AppShell'
import { useActiveExamType } from './app/useActiveExamType'
import QuizPage from './exam-types/quiz/components/QuizPage'
import ToeicPage from './exam-types/toeic/components/ToeicPage'
import VocabPage from './exam-types/vocab/components/VocabPage'
import IeltsComingSoon from './exam-types/ielts/IeltsComingSoon'

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const { activeExamType, setActiveExamType } = useActiveExamType()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <AppShell
      activeExamType={activeExamType}
      onChangeExamType={setActiveExamType}
      theme={theme}
      onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
    >
      {activeExamType === 'quiz' && <QuizPage />}
      {activeExamType === 'toeic' && <ToeicPage />}
      {activeExamType === 'vocab' && <VocabPage />}
      {activeExamType === 'ielts' && <IeltsComingSoon />}
    </AppShell>
  )
}
