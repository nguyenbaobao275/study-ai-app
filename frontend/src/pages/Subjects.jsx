import { useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/EmptyState";

const initialForm = { name: "", description: "" };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function loadSubjects() {
    const res = await api.get("/subjects");
    setSubjects(res.data);
  }

  useEffect(() => {
    loadSubjects().catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        await api.put(`/subjects/${editingId}`, form);
      } else {
        await api.post("/subjects", form);
      }
      setForm(initialForm);
      setEditingId(null);
      await loadSubjects();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(subject) {
    setEditingId(subject.id);
    setForm({ name: subject.name, description: subject.description || "" });
  }

  async function handleDelete(id) {
    if (!confirm("Xóa môn học này?")) return;
    await api.delete(`/subjects/${id}`);
    await loadSubjects();
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Quản lý môn học</h1>
        <p>Thêm các môn học để gắn nhiệm vụ và tài liệu.</p>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="panel">
        <form className="form-grid" onSubmit={handleSubmit}>
          <input
            aria-label="Tên môn học"
            placeholder="Tên môn học, ví dụ: Công nghệ phần mềm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            aria-label="Mô tả môn học"
            placeholder="Mô tả ngắn"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button className="btn btn-primary">{editingId ? "Cập nhật" : "Thêm môn"}</button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(initialForm); }}>
              Hủy
            </button>
          )}
        </form>
      </div>

      <div className="panel">
        <h2>Danh sách môn học</h2>
        {subjects.length ? (
          <div className="table-like">
            {subjects.map((subject) => (
              <div className="row" key={subject.id}>
                <div>
                  <strong>{subject.name}</strong>
                  <p>{subject.description || "Chưa có mô tả"}</p>
                </div>
                <div className="actions">
                  <button className="btn btn-ghost" onClick={() => handleEdit(subject)}>Sửa</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(subject.id)}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có môn học" />
        )}
      </div>
    </div>
  );
}
