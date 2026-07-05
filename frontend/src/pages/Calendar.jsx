import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/EmptyState";

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameDate(a, b) {
  return a.toISOString().slice(0, 10) === b;
}

export default function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  useEffect(() => {
    api.get("/tasks").then((res) => setTasks(res.data)).catch((err) => setError(err.message));
  }, []);

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const offset = first.getDay();
    const total = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < offset; i += 1) cells.push(null);
    for (let day = 1; day <= total; day += 1) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  function shiftMonth(step) {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + step, 1));
  }

  if (error) return <div className="alert error">{error}</div>;

  return (
    <div className="page">
      <div className="page-title split">
        <div>
          <h1>Lịch học</h1>
          <p>Theo dõi deadline theo tháng để tránh bỏ sót nhiệm vụ.</p>
        </div>
        <div className="actions">
          <button className="btn btn-ghost" onClick={() => shiftMonth(-1)}>Tháng trước</button>
          <button className="btn btn-ghost" onClick={() => shiftMonth(1)}>Tháng sau</button>
        </div>
      </div>

      <div className="panel">
        <h2>{cursor.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}</h2>
        <div className="calendar-grid calendar-head">
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((label) => <strong key={label}>{label}</strong>)}
        </div>
        <div className="calendar-grid">
          {days.map((date, index) => {
            const dayTasks = date ? tasks.filter((task) => sameDate(date, task.due_date)) : [];
            return (
              <div className={`calendar-cell ${!date ? "muted-cell" : ""}`} key={index}>
                {date && <b>{date.getDate()}</b>}
                {dayTasks.map((task) => (
                  <div className={`calendar-task ${task.status === "completed" ? "done-task" : ""}`} key={task.id}>
                    {task.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {!tasks.length && <EmptyState title="Chưa có nhiệm vụ" text="Thêm deadline ở trang Nhiệm vụ để lịch có dữ liệu." />}
      </div>
    </div>
  );
}
