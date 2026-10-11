export default function ConfirmSubmitModal({ unansweredCount, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box confirm-submit-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏁 Xác nhận nộp bài</h3>
        </div>
        <div className="modal-body">
          <p>Bạn chắc chắn muốn nộp bài ngay bây giờ?</p>
          {unansweredCount > 0 && (
            <p className="confirm-warning">⚠️ Còn {unansweredCount} câu chưa trả lời — các câu này sẽ được tính là bỏ qua.</p>
          )}
          <div className="confirm-actions">
            <button className="btn btn-ghost" onClick={onCancel}>Hủy</button>
            <button className="btn btn-danger" onClick={onConfirm}>Xác nhận nộp bài</button>
          </div>
        </div>
      </div>
    </div>
  )
}
