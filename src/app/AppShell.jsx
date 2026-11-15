import AppHeader from './AppHeader'

// Khung ứng dụng cố định: header trên cùng (menu loại đề thi, theme, help) + vùng nội dung bên dưới.
// Vùng nội dung do từng trang (ví dụ QuizPage) tự quyết định layout 2 cột của riêng nó.
export default function AppShell({ activeExamType, onChangeExamType, theme, onToggleTheme, children }) {
  return (
    <div className="min-h-screen">
      <AppHeader
        activeExamType={activeExamType}
        onChangeExamType={onChangeExamType}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <div className="min-h-screen pt-header-h">
        {children}
      </div>
    </div>
  )
}
