import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

export default function Admin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin").then((res) => setData(res.data)).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-screen">Đang tải trang admin...</div>;

  return (
    <div className="page">
      <div className="page-title">
        <h1>Admin</h1>
        <p>Theo dõi nhanh dữ liệu toàn hệ thống.</p>
      </div>

      <div className="stats-grid">
        <StatCard title="Người dùng" value={data.usersCount} hint="Tài khoản" />
        <StatCard title="Môn học" value={data.subjectsCount} hint="Toàn hệ thống" />
        <StatCard title="Nhiệm vụ" value={data.tasksCount} hint="Toàn hệ thống" />
        <StatCard title="Tài liệu" value={data.documentsCount} hint="Đã upload" />
        <StatCard title="Lượt quiz" value={data.attemptsCount} hint="Đã lưu kết quả" />
      </div>

      <div className="two-columns">
        <div className="panel">
          <h2>Người dùng mới</h2>
          <div className="list">
            {data.recentUsers.map((user) => (
              <div className="list-item" key={user.id}>
                <div>
                  <strong>{user.full_name}</strong>
                  <p>{user.email}</p>
                </div>
                <span className="badge">{user.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Tài liệu mới</h2>
          <div className="list">
            {data.recentDocuments.map((doc) => (
              <div className="list-item" key={doc.id}>
                <div>
                  <strong>{doc.title}</strong>
                  <p>{doc.users?.full_name || doc.users?.email || "Người dùng"}</p>
                </div>
                <span className="badge">.{doc.file_type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
