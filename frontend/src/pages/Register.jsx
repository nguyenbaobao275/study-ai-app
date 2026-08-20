import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.full_name, form.email, form.password);
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
            <span className="eyebrow">Bắt đầu cùng StudyAI</span>
            <h2>Một nơi để tổ chức toàn bộ hành trình học tập.</h2>
            <p>Tập trung tài liệu, kế hoạch và hoạt động ôn luyện trong một không gian rõ ràng, dễ sử dụng.</p>
          </div>
          <div className="auth-points"><span>Thiết lập nhanh</span><span>Dữ liệu riêng tư</span><span>Hỗ trợ học bằng AI</span></div>
        </section>
        <form className="auth-card" onSubmit={handleSubmit}>
          <span className="eyebrow">Tạo không gian học tập</span>
          <h1>Tạo tài khoản</h1>
          <p>Chỉ mất một phút để bắt đầu.</p>

          {error && <div className="alert error" role="alert">{error}</div>}

          <label htmlFor="register-name">Họ tên</label>
          <input id="register-name" autoComplete="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nguyễn Văn A" />

          <label htmlFor="register-email">Email</label>
          <input id="register-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />

          <label htmlFor="register-password">Mật khẩu</label>
          <input id="register-password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Ít nhất 6 ký tự" />

          <button className="btn btn-primary full" disabled={loading}>{loading ? "Đang tạo..." : "Đăng ký"}</button>

          <span className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></span>
        </form>
      </div>
    </div>
  );
}
