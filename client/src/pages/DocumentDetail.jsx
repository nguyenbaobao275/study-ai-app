import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

export default function DocumentDetail() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [flipped, setFlipped] = useState({});

  async function loadDocument() {
    const res = await api.get(`/documents/${id}`);
    setDocument(res.data);
  }

  useEffect(() => {
    loadDocument().catch((err) => setError(err.message));
  }, [id]);

  async function runAI(type) {
    setError("");
    setLoadingAction(type);
    try {
      if (type === "summary") await api.post(`/ai/summarize/${id}`);
      if (type === "flashcards") await api.post(`/ai/flashcards/${id}`);
      if (type === "quizzes") await api.post(`/ai/quizzes/${id}`);
      await loadDocument();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction("");
    }
  }

  const latestSummary = useMemo(() => document?.summaries?.[0], [document]);

  if (error) return <div className="alert error">{error}</div>;
  if (!document) return <div>Đang tải tài liệu...</div>;

  return (
    <div className="page">
      <div className="page-title split">
        <div>
          <Link to="/documents" className="back-link">← Quay lại tài liệu</Link>
          <h1>{document.title}</h1>
          <p>{document.subjects?.name || "Không gắn môn"} • {document.file_name}</p>
        </div>
      </div>

      <div className="ai-actions">
        <button className="btn btn-primary" onClick={() => runAI("summary")} disabled={!!loadingAction}>
          {loadingAction === "summary" ? "Đang tóm tắt..." : "Tóm tắt bằng AI"}
        </button>
        <button className="btn btn-secondary" onClick={() => runAI("flashcards")} disabled={!!loadingAction}>
          {loadingAction === "flashcards" ? "Đang tạo..." : "Tạo flashcard"}
        </button>
        <button className="btn btn-secondary" onClick={() => runAI("quizzes")} disabled={!!loadingAction}>
          {loadingAction === "quizzes" ? "Đang tạo..." : "Tạo quiz"}
        </button>
      </div>

      <div className="panel">
        <h2>Nội dung trích xuất</h2>
        <pre className="document-text">{document.extracted_text}</pre>
      </div>

      <div className="panel">
        <h2>Bản tóm tắt mới nhất</h2>
        {latestSummary ? (
          <pre className="summary-box">{latestSummary.content}</pre>
        ) : (
          <p className="muted">Chưa có bản tóm tắt. Bấm “Tóm tắt bằng AI” để tạo.</p>
        )}
      </div>

      <div className="panel">
        <h2>Flashcard</h2>
        {document.flashcards?.length ? (
          <div className="flashcard-grid">
            {document.flashcards.map((card) => {
              const isFlipped = flipped[card.id];
              return (
                <button
                  className="flashcard"
                  key={card.id}
                  onClick={() => setFlipped({ ...flipped, [card.id]: !isFlipped })}
                >
                  <span>{isFlipped ? "Câu trả lời" : "Câu hỏi"}</span>
                  <strong>{isFlipped ? card.answer : card.question}</strong>
                  <small>Bấm để lật thẻ</small>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="muted">Chưa có flashcard.</p>
        )}
      </div>

      <div className="panel">
        <h2>Quiz ôn tập</h2>
        {document.quizzes?.length ? (
          <div className="quiz-list">
            {document.quizzes.map((quiz, index) => {
              const selected = selectedAnswers[quiz.id];
              const isCorrect = selected && selected === quiz.correct_answer;

              return (
                <div className="quiz-card" key={quiz.id}>
                  <h3>Câu {index + 1}: {quiz.question}</h3>
                  {["A", "B", "C", "D"].map((option) => {
                    const value = quiz[`option_${option.toLowerCase()}`];
                    return (
                      <button
                        key={option}
                        className={`option ${selected === option ? "selected" : ""}`}
                        onClick={() => setSelectedAnswers({ ...selectedAnswers, [quiz.id]: option })}
                      >
                        <b>{option}.</b> {value}
                      </button>
                    );
                  })}

                  {selected && (
                    <div className={`answer-result ${isCorrect ? "correct" : "wrong"}`}>
                      {isCorrect ? "Đúng rồi." : `Sai. Đáp án đúng là ${quiz.correct_answer}.`}
                      {quiz.explanation && <p>{quiz.explanation}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">Chưa có câu hỏi ôn tập.</p>
        )}
      </div>
    </div>
  );
}
