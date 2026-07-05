import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [planning, setPlanning] = useState(false);

  async function load() {
    const res = await api.get("/dashboard");
    setData(res.data);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function generatePlan() {
    setPlanning(true);
    setError("");
    try {
      const res = await api.post("/ai/study-plan");
      await load();
      if (res.data?.persisted === false) {
        setData((current) => ({
          ...current,
          latestStudyPlan: res.data
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPlanning(false);
    }
  }

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-screen">Đang tải dashboard...</div>;

  return (
    <div className="page">
      <div className="page-title split">
        <div>
          <h1>Dashboard</h1>
          <p>Tổng quan tình hình học tập, deadline, tài liệu và tiến độ ôn tập.</p>
        </div>
        <button className="btn btn-primary" onClick={generatePlan} disabled={planning}>
          {planning ? "Đang tạo kế hoạch..." : "Tạo kế hoạch AI"}
        </button>
      </div>

      <div className="stats-grid">
        <StatCard title="Môn học" value={data.subjectsCount} hint="Đang quản lý" />
        <StatCard title="Nhiệm vụ" value={data.tasksCount} hint={`${data.completedTasks} đã hoàn thành`} />
        <StatCard title="Tài liệu" value={data.documentsCount} hint="Đã upload" />
        <StatCard title="Flashcard" value={data.flashcardsCount} hint="Thẻ ôn tập" />
        <StatCard title="Quiz" value={data.quizzesCount} hint={`${data.attemptsCount} lượt làm`} />
        <StatCard title="Điểm TB" value={`${data.averageScore || 0}%`} hint="Theo quiz đã lưu" />
      </div>

      {data.latestStudyPlan && (
        <div className="panel">
          <h2>Kế hoạch học tập AI mới nhất</h2>
          <pre className="summary-box">{data.latestStudyPlan.content}</pre>
        </div>
      )}

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
          <h2>Tiến độ theo môn</h2>
          {data.subjectProgress?.length ? (
            <div className="list">
              {data.subjectProgress.map((subject) => {
                const percent = subject.tasksCount ? Math.round((subject.completedTasks / subject.tasksCount) * 100) : 0;
                return (
                  <div className="progress-item" key={subject.id}>
                    <div className="list-item compact">
                      <div>
                        <strong>{subject.name}</strong>
                        <p>{subject.documentsCount} tài liệu • {subject.completedTasks}/{subject.tasksCount} nhiệm vụ</p>
                      </div>
                      <span className="badge">{percent}%</span>
                    </div>
                    <div className="progress-bar"><span style={{ width: `${percent}%` }} /></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Chưa có dữ liệu môn học" />
          )}
        </div>
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
  );
}
