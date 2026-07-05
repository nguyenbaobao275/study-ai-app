export default function EmptyState({ title = "Chưa có dữ liệu", text = "Hãy thêm dữ liệu đầu tiên để bắt đầu." }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
