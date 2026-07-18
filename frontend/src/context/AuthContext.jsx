import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("study_ai_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      const token = localStorage.getItem("study_ai_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        localStorage.setItem("study_ai_user", JSON.stringify(data.user));
      } catch {
        localStorage.removeItem("study_ai_token");
        localStorage.removeItem("study_ai_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("study_ai_token", data.token);
    localStorage.setItem("study_ai_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function register(full_name, email, password) {
    const { data } = await api.post("/auth/register", { full_name, email, password });
    localStorage.setItem("study_ai_token", data.token);
    localStorage.setItem("study_ai_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function logout() {
    try { await api.post("/auth/logout"); }
    finally {
      localStorage.removeItem("study_ai_token");
      localStorage.removeItem("study_ai_user");
      setUser(null);
    }
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
