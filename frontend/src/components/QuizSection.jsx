import { useEffect, useState } from "react";

export default function QuizSection({ quizzes = [], generationId, onSubmit, submitting, latestAttempt }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  useEffect(() => { setAnswers({}); setResult(null); }, [generationId]);
  const resultMap = new Map((result?.results || []).map((item) => [item.quiz_id, item]));
  async function submit() { const response = await onSubmit({ generation_id: generationId, answers }); setResult(response); }
  return (
    <div className="panel">
      <div className="split-row"><h2>Quiz ôn tập</h2>{(result?.attempt || latestAttempt) && <span className="badge success">Điểm: {(result?.attempt || latestAttempt).score}%</span>}</div>
      {quizzes.length ? <>
        <div className="quiz-list">{quizzes.map((quiz, index) => {
          const detail = resultMap.get(quiz.id);
          return <div className="quiz-card" key={quiz.id}><h3>Câu {index + 1}: {quiz.question}</h3>
            {["A", "B", "C", "D"].map((option) => <button key={option} disabled={!!result} className={`option ${answers[quiz.id] === option ? "selected" : ""}`} onClick={() => setAnswers({ ...answers, [quiz.id]: option })}><b>{option}.</b> {quiz[`option_${option.toLowerCase()}`]}</button>)}
            {detail && <div className={`answer-result ${detail.is_correct ? "correct" : "wrong"}`}>{detail.is_correct ? "Đúng." : `Sai. Đáp án đúng là ${detail.correct_answer}.`}{detail.explanation && <p>{detail.explanation}</p>}</div>}
          </div>;
        })}</div>
        <button className="btn btn-primary" disabled={submitting || !generationId || !Object.keys(answers).length || !!result} onClick={submit}>{submitting ? "Đang chấm..." : "Nộp bài"}</button>
      </> : <p className="muted">Chưa có câu hỏi ôn tập.</p>}
    </div>
  );
}
