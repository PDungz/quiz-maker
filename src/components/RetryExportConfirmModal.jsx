export default function RetryExportConfirmModal({ onExportThenRetry, onRetryWithoutExport, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box confirm-submit-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📥 Chưa xuất kết quả</h3>
        </div>
        <div className="modal-body">
          <p>Bạn chưa xuất file kết quả lần làm này. Sau khi làm lại, kết quả hiện tại vẫn xem lại được trong phiên này, nhưng sẽ mất nếu đóng tab hoặc xoá dữ liệu.</p>
          <div className="confirm-actions retry-export-actions">
            <button className="btn btn-ghost" onClick={onCancel}>Hủy</button>
            <button className="btn btn-ghost" onClick={onRetryWithoutExport}>Làm lại luôn</button>
            <button className="btn btn-primary" onClick={onExportThenRetry}>Xuất file rồi làm lại</button>
          </div>
        </div>
      </div>
    </div>
  )
}
