import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import CitationList from "../components/CitationList";
import AIGenerationHistory from "../components/AIGenerationHistory";
import GenerationEditor from "../components/GenerationEditor";
import QuizSection from "../components/QuizSection";

const statusLabels = { pending: "Chưa lập chỉ mục", processing: "Đang lập chỉ mục", completed: "Đã sẵn sàng", failed: "Lập chỉ mục thất bại" };

export default function DocumentDetail() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [viewedGeneration, setViewedGeneration] = useState(null);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [question, setQuestion] = useState("");
  const [flipped, setFlipped] = useState({});
  const [quizCount, setQuizCount] = useState(5);

  async function loadAll() {
    const [docRes, generationRes] = await Promise.all([api.get(`/documents/${id}`), api.get(`/documents/${id}/ai-generations`)]);
    setDocument(docRes.data); setGenerations(generationRes.data);
  }
  useEffect(() => { loadAll().catch((err) => setError(err.message)); }, [id]);

  async function run(action, callback) {
    setError(""); setLoadingAction(action);
    try { const result = await callback(); await loadAll(); return result; }
    catch (err) { setError(err.message); throw err; }
    finally { setLoadingAction(""); }
  }
  async function runAI(type) {
    try { await run(type, () => type === "summary" ? api.post(`/ai/summarize/${id}`) : type === "flashcards" ? api.post(`/ai/flashcards/${id}`) : api.post(`/ai/quizzes/${id}`, { question_count: quizCount })); } catch {}
  }
  async function askDocument(e) {
    e.preventDefault(); if (!question.trim()) return;
    try { await run("chat", () => api.post(`/ai/chat/${id}`, { question })); setQuestion(""); } catch {}
  }
  async function submitQuiz(payload) {
    try { return (await run("attempt", () => api.post(`/ai/quiz-attempts/${id}`, payload))).data; } catch { return null; }
  }
  async function viewGeneration(itemOrId) {
    const generationId = typeof itemOrId === "string" ? itemOrId : itemOrId.id;
    try { setViewedGeneration((await api.get(`/ai-generations/${generationId}`)).data); } catch (err) { setError(err.message); }
  }
  async function activateGeneration(item) { try { await run("generation", () => api.patch(`/ai-generations/${item.id}/activate`)); setViewedGeneration(null); } catch {} }
  async function deleteGeneration(item) {
    if (!confirm(`Xóa phiên bản ${item.version_number}?`)) return;
    try { await run("generation", () => api.delete(`/ai-generations/${item.id}`)); if (viewedGeneration?.id === item.id) setViewedGeneration(null); } catch {}
  }
  async function downloadOriginal() {
    try { const { data } = await api.get(`/documents/${id}/download-url`); window.open(data.url, "_blank", "noopener,noreferrer"); } catch (err) { setError(err.message); }
  }
  async function exportSummary() {
    setLoadingAction("export");
    try {
      const res = await api.get(`/documents/${id}/export/summary`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data); const anchor = window.document.createElement("a");
      anchor.href = url; anchor.download = `${document.title || "summary"}-summary.pdf`; anchor.click(); URL.revokeObjectURL(url);
    } catch (err) { setError(err.message); } finally { setLoadingAction(""); }
  }

  const latestSummary = document?.summaries?.[0];
  const latestAttempt = document?.quizAttempts?.[0];
  const quizGenerationId = document?.active_generations?.quiz?.id;
  const grouped = useMemo(() => ({ summary: generations.filter((item) => item.content_type === "summary"), flashcards: generations.filter((item) => item.content_type === "flashcards"), quiz: generations.filter((item) => item.content_type === "quiz") }), [generations]);
  if (!document) return <div className="center-screen">{error || "Đang tải tài liệu..."}</div>;

  return <div className="page">
    <div className="page-title split"><div><Link to="/documents" className="back-link">← Quay lại tài liệu</Link><h1>{document.title}</h1><p>{document.subjects?.name || "Không gắn môn"} · {document.file_name}</p></div>
      <div className="actions"><span className={`badge index-${document.index_status}`}>{statusLabels[document.index_status] || document.index_status}</span><button className="btn btn-ghost" onClick={downloadOriginal}>Tải file gốc</button></div></div>
    {error && <div className="alert error">{error}</div>}
    {["pending", "failed"].includes(document.index_status) && <div className={document.index_status === "failed" ? "alert error" : "alert"}>{document.index_error || "Tài liệu chưa sẵn sàng cho RAG và tìm kiếm ngữ nghĩa."} <button className="btn btn-ghost" disabled={loadingAction === "reindex"} onClick={() => run("reindex", () => api.post(`/documents/${id}/reindex`)).catch(() => {})}>Lập chỉ mục lại</button></div>}

    <div className="ai-actions"><button className="btn btn-primary" disabled={!!loadingAction} onClick={() => runAI("summary")}>Tóm tắt AI</button><button className="btn btn-secondary" disabled={!!loadingAction} onClick={() => runAI("flashcards")}>Tạo flashcard</button>
      <label className="quiz-count">Số câu quiz<select value={quizCount} onChange={(e) => setQuizCount(Number(e.target.value))}>{[5, 10, 15, 20].map((count) => <option key={count}>{count}</option>)}</select></label>
      <button className="btn btn-secondary" disabled={!!loadingAction} onClick={() => runAI("quiz")}>Tạo quiz</button><button className="btn btn-ghost" disabled={!latestSummary || !!loadingAction} onClick={exportSummary}>Xuất PDF</button></div>

    <div className="panel"><h2>Chat hỏi đáp theo tài liệu</h2><form className="chat-form" onSubmit={askDocument}><input aria-label="Câu hỏi về tài liệu" maxLength="1000" placeholder="Hỏi AI về nội dung tài liệu..." value={question} onChange={(e) => setQuestion(e.target.value)} /><button className="btn btn-primary" disabled={loadingAction === "chat"}>Gửi</button></form>
      <div className="chat-list">{document.chats?.map((chat) => <div className="chat-item" key={chat.id}><strong>{chat.question}</strong><p>{chat.answer}</p><CitationList citations={chat.citations} /></div>)}</div></div>

    <div className="panel"><div className="split-row"><h2>Bản tóm tắt đang dùng</h2></div>{latestSummary ? <pre className="summary-box">{latestSummary.content}</pre> : <p className="muted">Chưa có bản tóm tắt.</p>}</div>
    <div className="panel"><h2>Flashcard đang dùng</h2>{document.flashcards?.length ? <div className="flashcard-grid">{document.flashcards.map((card) => <button className="flashcard" key={card.id} onClick={() => setFlipped({ ...flipped, [card.id]: !flipped[card.id] })}><span>{flipped[card.id] ? "Câu trả lời" : "Câu hỏi"}</span><strong>{flipped[card.id] ? card.answer : card.question}</strong><small>Bấm để lật thẻ</small></button>)}</div> : <p className="muted">Chưa có flashcard.</p>}</div>
    <QuizSection quizzes={document.quizzes} generationId={quizGenerationId} latestAttempt={latestAttempt} submitting={loadingAction === "attempt"} onSubmit={submitQuiz} />

    <div className="panel"><h2>Lịch sử nội dung AI</h2>{["summary", "flashcards", "quiz"].map((type) => <div className="history-group" key={type}><h3>{type === "summary" ? "Tóm tắt" : type === "flashcards" ? "Flashcard" : "Quiz"}</h3><AIGenerationHistory items={grouped[type]} busy={loadingAction === "generation"} onView={viewGeneration} onActivate={activateGeneration} onDelete={deleteGeneration} /></div>)}</div>
    <GenerationEditor generation={viewedGeneration} onClose={() => setViewedGeneration(null)} onSaved={viewGeneration} />
    <details className="panel"><summary>Nội dung trích xuất</summary><pre className="document-text">{document.extracted_text}</pre></details>
  </div>;
}
