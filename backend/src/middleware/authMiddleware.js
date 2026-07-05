import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, created_at")
      .eq("id", decoded.id)
      .single();

    if (error?.code === "42703") {
      const fallback = await supabase
        .from("users")
        .select("id, full_name, email, created_at")
        .eq("id", decoded.id)
        .single();

      user = fallback.data ? { ...fallback.data, role: "user" } : null;
      error = fallback.error;
    }

    if (error || !user) {
      return res.status(401).json({ message: "Tài khoản không tồn tại" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Bạn không có quyền admin" });
  }

  next();
}
