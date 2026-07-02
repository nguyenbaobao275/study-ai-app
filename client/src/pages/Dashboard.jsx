import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/dashboard");
        setData(res.data);
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div>Đang tải dashboard...</div>;

  return (
    <div className="page">
      <div className="page-title">
        <h1>Dashboard</h1>
        <p>Tổng quan tình hình học tập và tài liệu của bạn.</p>
      </div>

      <div className="stats-grid">
        <StatCard title="Môn học" value={data.subjectsCount} hint="Đang quản lý" />
        <StatCard title="Nhiệm vụ" value={data.tasksCount} hint={`${data.completedTasks} đã hoàn thành`} />
        <StatCard title="Tài liệu" value={data.documentsCount} hint="Đã upload" />
        <StatCard title="Tóm tắt AI" value={data.summariesCount} hint="Bản tóm tắt" />
        <StatCard title="Flashcard" value={data.flashcardsCount} hint="Thẻ ôn tập" />
        <StatCard title="Quiz" value={data.quizzesCount} hint="Câu hỏi" />
      </div>

      <div className="two-columns">
        <div className="panel">
          <h2>Deadline sắp tới</h2>
          {data.upcomingTasks?.length ? (
            <div className="list">
              {data.upcomingTasks.map((task) => (
                <div className="list-item" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.subjects?.name || "Không gắn môn"}</p>
                  </div>
                  <span className="badge">{task.due_date}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có deadline" text="Thêm nhiệm vụ học tập để theo dõi tiến độ." />
          )}
        </div>

        <div className="panel">
          <h2>Tài liệu mới nhất</h2>
          {data.recentDocuments?.length ? (
            <div className="list">
              {data.recentDocuments.map((doc) => (
                <div className="list-item" key={doc.id}>
                  <div>
                    <strong>{doc.title}</strong>
                    <p>{doc.subjects?.name || "Không gắn môn"}</p>
                  </div>
                  <span className="badge">.{doc.file_type}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có tài liệu" text="Upload file .txt, .md, .pdf hoặc .docx để dùng chức năng AI." />
          )}
        </div>
      </div>
    </div>
  );
}
