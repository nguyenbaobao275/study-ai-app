export default function StatCard({ title, value, hint }) {
  return (
    <div className="stat-card">
      <p>{title}</p>
      <strong>{value}</strong>
      {hint && <span>{hint}</span>}
    </div>
  );
}
