import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import EmptyState from "../components/EmptyState";

function ResultGroup({ title, items, render }) {
  return (
    <div className="panel">
      <h2>{title}</h2>
      {items.length ? <div className="list">{items.map(render)}</div> : <EmptyState title="Không có kết quả" />}
    </div>
  );
}

export default function Search() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function search(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.get("/search", { params: { q } });
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Tìm kiếm học liệu</h1>
        <p>Tìm trong tài liệu, tóm tắt, flashcard và quiz đã tạo.</p>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="panel">
        <form className="search-form" onSubmit={search}>
          <input placeholder="Nhập từ khóa cần tìm..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-primary">Tìm kiếm</button>
        </form>
      </div>

      {result && (
        <>
          <ResultGroup
            title="Tài liệu"
            items={result.documents || []}
            render={(doc) => (
              <Link className="list-item" to={`/documents/${doc.id}`} key={doc.id}>
                <div>
                  <strong>{doc.title}</strong>
                  <p>{doc.subjects?.name || "Không gắn môn"} • {doc.file_name}</p>
                </div>
                <span className="badge">.{doc.file_type}</span>
              </Link>
            )}
          />
          <ResultGroup
            title="Tóm tắt"
            items={result.summaries || []}
            render={(item) => (
              <Link className="list-item" to={`/documents/${item.document_id}`} key={item.id}>
                <p>{item.content.slice(0, 220)}...</p>
              </Link>
            )}
          />
          <ResultGroup
            title="Flashcard"
            items={result.flashcards || []}
            render={(item) => (
              <Link className="list-item" to={`/documents/${item.document_id}`} key={item.id}>
                <div>
                  <strong>{item.question}</strong>
                  <p>{item.answer}</p>
                </div>
              </Link>
            )}
          />
          <ResultGroup
            title="Quiz"
            items={result.quizzes || []}
            render={(item) => (
              <Link className="list-item" to={`/documents/${item.document_id}`} key={item.id}>
                <div>
                  <strong>{item.question}</strong>
                  <p>{item.explanation || "Có trong bộ câu hỏi ôn tập"}</p>
                </div>
              </Link>
            )}
          />
        </>
      )}
    </div>
  );
}
