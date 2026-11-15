import ExamTypeMenu from './ExamTypeMenu'
import { Button } from '@/components/ui/button'

// Header tĩnh trên cùng, không đổi theo loại đề thi: logo, menu chuyển loại đề thi, theme.
// Nút "hướng dẫn định dạng file" KHÔNG đặt ở đây vì mỗi loại đề thi (Quiz/TOEIC/IELTS) có
// định dạng file khác nhau — mỗi trang tự hiển thị hướng dẫn riêng của nó trong sidebar cấu hình.
export default function AppHeader({ activeExamType, onChangeExamType, theme, onToggleTheme }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-header-h z-30 flex items-center gap-5 px-5 bg-card border-b">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-muted border flex items-center justify-center text-base shrink-0">📝</div>
        <div className="text-sm font-bold whitespace-nowrap hidden md:block">Quiz Maker</div>
      </div>
      <ExamTypeMenu activeExamType={activeExamType} onChange={onChangeExamType} />
      <div className="flex items-center gap-2.5 ml-auto">
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-full"
          title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          onClick={onToggleTheme}
        >{theme === 'dark' ? '☀️' : '🌙'}</Button>
      </div>
    </header>
  )
}
