import ReviewFilterTabs from './ReviewFilterTabs'
import ReviewScrollView from './ReviewScrollView'

// Phần nội dung chính (filter tabs + danh sách review) khi xem kết quả đã hoàn thành.
// Dùng chung bởi App.jsx (vừa nộp bài xong) và ResultsPage.jsx (mở file kết quả đã lưu/xem lại
// kết quả trước đó) — trước đây 2 nơi này tự viết lại gần giống nhau và lệch nhau dần, gây ra
// nhiều bug (retry không phản ứng, xem kết quả trước đó bị trống...).
export default function ResultsContent({
  questions, answers, reviewFilter, onFilterChange, scoreMode, pointMode, customPoints,
  highlightIndex, selectedSet, onToggleSelect, onSelectMany,
}) {
  return (
    <>
      <ReviewFilterTabs
        questions={questions}
        answers={answers}
        reviewFilter={reviewFilter}
        onFilterChange={onFilterChange}
        selectedSet={selectedSet}
        onSelectMany={onSelectMany}
      />
      <ReviewScrollView
        questions={questions}
        answers={answers}
        reviewFilter={reviewFilter}
        scoreMode={scoreMode}
        pointMode={pointMode}
        customPoints={customPoints}
        highlightIndex={highlightIndex}
        selectedSet={selectedSet}
        onToggleSelect={onToggleSelect}
      />
    </>
  )
}
