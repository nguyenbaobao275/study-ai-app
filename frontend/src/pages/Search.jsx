import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import EmptyState from "../components/EmptyState";

function ResultGroup({ title, items, render }) { return <div className="panel"><h2>{title}</h2>{items.length ? <div className="list">{items.map(render)}</div> : <EmptyState title="Không có kết quả" />}</div>; }

export default function Search() {
  const [q, setQ] = useState(""); const [mode, setMode] = useState("hybrid"); const [result, setResult] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function search(e) { e.preventDefault(); setError(""); setLoading(true); try { setResult((await api.get("/search", { params: { q, mode, limit: 10 } })).data); } catch (err) { setError(err.message); } finally { setLoading(false); } }
  return <div className="page"><div className="page-title"><h1>Tìm kiếm học liệu</h1><p>Tìm theo ý nghĩa, từ khóa hoặc kết hợp cả hai.</p></div>{error && <div className="alert error">{error}</div>}
    <div className="panel"><form className="search-form" onSubmit={search}><input minLength="2" maxLength="500" placeholder="Nhập nội dung cần tìm..." value={q} onChange={(e) => setQ(e.target.value)} /><select value={mode} onChange={(e) => setMode(e.target.value)}><option value="hybrid">Tìm kiếm kết hợp</option><option value="semantic">Tìm theo ngữ nghĩa</option><option value="keyword">Tìm theo từ khóa</option></select><button className="btn btn-primary" disabled={loading}>{loading ? "Đang tìm..." : "Tìm kiếm"}</button></form></div>
    {result?.search_mode_used === "keyword_fallback" && <div className="alert">Tìm kiếm ngữ nghĩa tạm thời không khả dụng, kết quả đang dùng từ khóa.</div>}
    {result && <><ResultGroup title="Tài liệu" items={result.documents || []} render={(doc) => <Link className="list-item search-result" to={`/documents/${doc.id}`} key={doc.id}><div><strong>{doc.title}</strong><p>{doc.subjects?.name || "Không gắn môn"} · .{doc.file_type}</p>{doc.matched_chunks?.map((chunk) => <div className="search-excerpt" key={chunk.chunk_id}><p>{chunk.excerpt}</p><small>{chunk.page_number ? `Trang ${chunk.page_number} · ` : ""}Đoạn {chunk.chunk_index + 1} · Mức liên quan {chunk.similarity.toFixed(2)}</small></div>)}</div></Link>} />
      <ResultGroup title="Tóm tắt" items={result.summaries || []} render={(item) => <Link className="list-item" to={`/documents/${item.document_id}`} key={item.id}><p>{item.content.slice(0, 220)}...</p></Link>} />
      <ResultGroup title="Flashcard" items={result.flashcards || []} render={(item) => <Link className="list-item" to={`/documents/${item.document_id}`} key={item.id}><div><strong>{item.question}</strong><p>{item.answer}</p></div></Link>} />
      <ResultGroup title="Quiz" items={result.quizzes || []} render={(item) => <Link className="list-item" to={`/documents/${item.document_id}`} key={item.id}><strong>{item.question}</strong></Link>} /></>}
  </div>;
}
