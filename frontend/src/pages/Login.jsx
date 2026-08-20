import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-intro" aria-label="Giới thiệu StudyAI">
          <div className="auth-brand"><span>AI</span> StudyAI</div>
          <div>
            <span className="eyebrow">Không gian học tập cá nhân</span>
            <h2>Học tập có định hướng, tiến bộ có thể nhìn thấy.</h2>
            <p>Quản lý môn học, deadline và biến tài liệu thành nội dung ôn tập với sự hỗ trợ của AI.</p>
          </div>
          <div className="auth-points"><span>Tóm tắt tài liệu</span><span>Flashcard & quiz</span><span>Theo dõi tiến độ</span></div>
        </section>
        <form className="auth-card" onSubmit={handleSubmit}>
          <span className="eyebrow">Chào mừng trở lại</span>
          <h1>Đăng nhập StudyAI</h1>
          <p>Tiếp tục hành trình học tập của bạn.</p>

          {error && <div className="alert error" role="alert">{error}</div>}

          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />

          <label htmlFor="login-password">Mật khẩu</label>
          <input id="login-password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Ít nhất 6 ký tự" />

          <button className="btn btn-primary full" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>

          <span className="auth-switch">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></span>
        </form>
      </div>
    </div>
  );
}
