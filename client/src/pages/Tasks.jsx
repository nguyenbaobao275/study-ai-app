import { useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/EmptyState";

const initialForm = { title: "", description: "", due_date: "", subject_id: "" };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  async function loadData() {
    const [taskRes, subjectRes] = await Promise.all([
      api.get("/tasks"),
      api.get("/subjects")
    ]);
    setTasks(taskRes.data);
    setSubjects(subjectRes.data);
  }

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      await api.post("/tasks", form);
      setForm(initialForm);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function completeTask(id) {
    await api.patch(`/tasks/${id}/complete`);
    await loadData();
  }

  async function deleteTask(id) {
    if (!confirm("Xóa nhiệm vụ này?")) return;
    await api.delete(`/tasks/${id}`);
    await loadData();
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Nhiệm vụ học tập</h1>
        <p>Theo dõi deadline, bài tập và kế hoạch ôn thi.</p>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="panel">
        <form className="form-grid" onSubmit={handleSubmit}>
          <input
            placeholder="Tên nhiệm vụ"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
            <option value="">Chọn môn học</option>
            {subjects.map((subject) => (
              <option value={subject.id} key={subject.id}>{subject.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
          <input
            placeholder="Mô tả"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button className="btn btn-primary">Thêm nhiệm vụ</button>
        </form>
      </div>

      <div className="panel">
        <h2>Danh sách nhiệm vụ</h2>
        {tasks.length ? (
          <div className="table-like">
            {tasks.map((task) => (
              <div className="row" key={task.id}>
                <div>
                  <strong className={task.status === "completed" ? "done" : ""}>{task.title}</strong>
                  <p>{task.subjects?.name || "Không gắn môn"} • Hạn: {task.due_date}</p>
                  {task.description && <small>{task.description}</small>}
                </div>
                <div className="actions">
                  <span className={`badge ${task.status === "completed" ? "success" : ""}`}>{task.status}</span>
                  {task.status !== "completed" && (
                    <button className="btn btn-ghost" onClick={() => completeTask(task.id)}>Hoàn thành</button>
                  )}
                  <button className="btn btn-danger" onClick={() => deleteTask(task.id)}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có nhiệm vụ" />
        )}
      </div>
    </div>
  );
}
