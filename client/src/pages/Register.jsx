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
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Tạo tài khoản</h1>
        <p>Bắt đầu quản lý việc học cá nhân của bạn.</p>

        {error && <div className="alert error">{error}</div>}

        <label>Họ tên</label>
        <input
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          placeholder="Nguyễn Văn A"
        />

        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="email@example.com"
        />

        <label>Mật khẩu</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Ít nhất 6 ký tự"
        />

        <button className="btn btn-primary full" disabled={loading}>
          {loading ? "Đang tạo..." : "Đăng ký"}
        </button>

        <span className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </span>
      </form>
    </div>
  );
}
