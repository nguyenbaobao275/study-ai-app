import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const icons = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  subjects: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
  tasks: <><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
  documents: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
  admin: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>
};

function NavIcon({ name }) {
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = [
    { to: "/", label: "Dashboard", icon: "dashboard" },
    { to: "/subjects", label: "Môn học", icon: "subjects" },
    { to: "/tasks", label: "Nhiệm vụ", icon: "tasks" },
    { to: "/calendar", label: "Lịch học", icon: "calendar" },
    { to: "/documents", label: "Tài liệu", icon: "documents" },
    { to: "/search", label: "Tìm kiếm", icon: "search" },
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin", icon: "admin" }] : [])
  ];

  async function handleLogout() {
    try { await logout(); } finally { navigate("/login"); }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">AI</div>
          <div>
            <h1>StudyAI</h1>
            <p>Trợ lý học tập cá nhân</p>
          </div>
        </div>

        <nav className="nav-menu" aria-label="Điều hướng chính">
          {menu.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"}>
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-note">
          <span className="sidebar-note-icon" aria-hidden="true" />
          <div><strong>Học thông minh hơn</strong><small>AI đồng hành cùng tiến độ của bạn</small></div>
        </div>
      </aside>

      <main className="main" id="main-content">
        <header className="topbar">
          <div>
            <h2>Xin chào, {user?.full_name}</h2>
            <p>Hôm nay mình xử lý gọn việc học nhé.</p>
          </div>
          <div className="topbar-actions">
            <div className="user-chip" aria-label={`Tài khoản ${user?.full_name || "người dùng"}`}>
              <span>{user?.full_name?.trim()?.charAt(0)?.toUpperCase() || "U"}</span>
              <div><strong>{user?.full_name}</strong><small>{user?.role === "admin" ? "Quản trị viên" : "Học viên"}</small></div>
            </div>
            <button className="btn btn-ghost" onClick={handleLogout}>Đăng xuất</button>
          </div>
        </header>

        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
