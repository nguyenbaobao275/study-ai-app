import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menu = [
  { to: "/", label: "Dashboard" },
  { to: "/subjects", label: "Môn học" },
  { to: "/tasks", label: "Nhiệm vụ" },
  { to: "/documents", label: "Tài liệu" }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">AI</div>
          <div>
            <h1>StudyAI</h1>
            <p>Trợ lý học tập cá nhân</p>
          </div>
        </div>

        <nav className="nav-menu">
          {menu.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>Xin chào, {user?.full_name}</h2>
            <p>Hôm nay mình xử lý gọn việc học nhé.</p>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>Đăng xuất</button>
        </header>

        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
