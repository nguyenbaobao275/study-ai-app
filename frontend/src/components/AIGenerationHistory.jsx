const typeNames = { summary: "Tóm tắt", flashcards: "Flashcard", quiz: "Quiz" };

export default function AIGenerationHistory({ items = [], onView, onActivate, onDelete, busy }) {
  if (!items.length) return <p className="muted">Chưa có lịch sử phiên bản.</p>;
  return (
    <div className="generation-list">
      {items.map((item) => (
        <div className="generation-row" key={item.id}>
          <div>
            <div className="generation-title">
              <strong>{typeNames[item.content_type]} · Phiên bản {item.version_number}</strong>
              {item.is_active && <span className="badge success">Đang sử dụng</span>}
              <span className={`badge status-${item.status}`}>{item.status}</span>
            </div>
            <small>{new Date(item.created_at).toLocaleString("vi-VN")}{item.config?.question_count ? ` · ${item.config.question_count} câu` : ""}</small>
            {item.error_message && <p className="generation-error">{item.error_message}</p>}
          </div>
          <div className="actions">
            <button className="btn btn-ghost" disabled={busy || item.status !== "completed"} onClick={() => onView(item)}>Xem / sửa</button>
            {!item.is_active && <button className="btn btn-secondary" disabled={busy || item.status !== "completed"} onClick={() => onActivate(item)}>Sử dụng</button>}
            <button className="btn btn-danger" disabled={busy || item.status === "processing"} onClick={() => onDelete(item)}>Xóa</button>
          </div>
        </div>
      ))}
    </div>
  );
}

