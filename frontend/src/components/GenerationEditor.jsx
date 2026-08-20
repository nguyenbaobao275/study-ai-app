import { useEffect, useState } from "react";
import api from "../services/api";

export default function GenerationEditor({ generation, onSaved, onClose }) {
  const [content, setContent] = useState(generation?.content);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  useEffect(() => setContent(generation?.content), [generation]);
  if (!generation) return null;

  async function save(type, id, body) {
    setSaving(id); setError("");
    try { await api.patch(`/${type}/${id}`, body); await onSaved(generation.id); }
    catch (err) { setError(err.message); }
    finally { setSaving(""); }
  }

  const items = Array.isArray(content) ? content : content ? [content] : [];
  return (
    <div className="panel generation-editor">
      <div className="split-row"><h2>Phiên bản {generation.version_number}</h2><button className="btn btn-ghost" onClick={onClose}>Đóng</button></div>
      {error && <div className="alert error">{error}</div>}
      {generation.content_type === "summary" && items[0] && (
        <div className="editor-block"><textarea aria-label="Nội dung tóm tắt" rows="12" value={items[0].content} onChange={(e) => setContent({ ...items[0], content: e.target.value })} />
          <button className="btn btn-primary" disabled={saving} onClick={() => save("summaries", items[0].id, { content: items[0].content })}>Lưu tóm tắt</button></div>
      )}
      {generation.content_type === "flashcards" && items.map((item, index) => (
        <div className="editor-block" key={item.id}><input aria-label={`Câu hỏi flashcard ${index + 1}`} value={item.question} onChange={(e) => setContent(items.map((row, i) => i === index ? { ...row, question: e.target.value } : row))} />
          <textarea aria-label={`Câu trả lời flashcard ${index + 1}`} rows="3" value={item.answer} onChange={(e) => setContent(items.map((row, i) => i === index ? { ...row, answer: e.target.value } : row))} />
          <button className="btn btn-primary" disabled={saving === item.id} onClick={() => save("flashcards", item.id, { question: item.question, answer: item.answer })}>Lưu thẻ</button></div>
      ))}
      {generation.content_type === "quiz" && items.map((item, index) => (
        <div className="editor-block" key={item.id}><input aria-label={`Câu hỏi quiz ${index + 1}`} value={item.question} onChange={(e) => setContent(items.map((row, i) => i === index ? { ...row, question: e.target.value } : row))} />
          <div className="option-grid">{["a", "b", "c", "d"].map((key) => <input aria-label={`Đáp án ${key.toUpperCase()} của câu ${index + 1}`} key={key} value={item[`option_${key}`]} onChange={(e) => setContent(items.map((row, i) => i === index ? { ...row, [`option_${key}`]: e.target.value } : row))} />)}</div>
          <select aria-label={`Đáp án đúng của câu ${index + 1}`} value={item.correct_answer} onChange={(e) => setContent(items.map((row, i) => i === index ? { ...row, correct_answer: e.target.value } : row))}>{["A", "B", "C", "D"].map((value) => <option key={value}>{value}</option>)}</select>
          <textarea aria-label={`Giải thích câu ${index + 1}`} rows="2" value={item.explanation || ""} onChange={(e) => setContent(items.map((row, i) => i === index ? { ...row, explanation: e.target.value } : row))} />
          <button className="btn btn-primary" disabled={saving === item.id} onClick={() => save("quizzes", item.id, item)}>Lưu câu hỏi</button></div>
      ))}
    </div>
  );
}
