import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import EmptyState from "../components/EmptyState";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ title: "", subject_id: "", file: null });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    const [docRes, subjectRes] = await Promise.all([
      api.get("/documents"),
      api.get("/subjects")
    ]);
    setDocuments(docRes.data);
    setSubjects(subjectRes.data);
  }

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setError("");

    if (!form.file) {
      setError("Vui lòng chọn file tài liệu.");
      return;
    }

    setLoading(true);

    try {
      const body = new FormData();
      body.append("title", form.title);
      body.append("subject_id", form.subject_id);
      body.append("file", form.file);

      await api.post("/documents/upload", body, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setForm({ title: "", subject_id: "", file: null });
      e.target.reset();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Xóa tài liệu này?")) return;
    await api.delete(`/documents/${id}`);
    await loadData();
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Tài liệu học tập</h1>
        <p>Upload tài liệu .txt, .md, .pdf, .docx để AI tóm tắt, tạo flashcard và quiz.</p>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="panel">
        <form className="form-grid" onSubmit={handleUpload}>
          <input
            placeholder="Tên tài liệu"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
            <option value="">Chọn môn học</option>
            {subjects.map((subject) => (
              <option value={subject.id} key={subject.id}>{subject.name}</option>
            ))}
          </select>
          <input type="file" accept=".txt,.md,.pdf,.docx" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} />
          <button className="btn btn-primary" disabled={loading}>{loading ? "Đang upload..." : "Upload tài liệu"}</button>
        </form>
      </div>

      <div className="panel">
        <h2>Danh sách tài liệu</h2>
        {documents.length ? (
          <div className="table-like">
            {documents.map((doc) => (
              <div className="row" key={doc.id}>
                <div>
                  <strong>{doc.title}</strong>
                  <p>{doc.subjects?.name || "Không gắn môn"} • {doc.file_name}</p>
                </div>
                <div className="actions">
                  <Link className="btn btn-ghost" to={`/documents/${doc.id}`}>Xem chi tiết</Link>
                  <button className="btn btn-danger" onClick={() => handleDelete(doc.id)}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có tài liệu" text="Upload file .txt, .md, .pdf hoặc .docx đầu tiên để dùng chức năng AI." />
        )}
      </div>
    </div>
  );
}
