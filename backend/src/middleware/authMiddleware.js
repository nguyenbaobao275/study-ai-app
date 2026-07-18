import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Bạn chưa đăng nhập." });
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const { data: user, error } = await supabase.from("users").select("id, full_name, email, role, token_version, created_at").eq("id", decoded.id).maybeSingle();
    if (error) return next(error);
    if (!user || Number(decoded.tokenVersion ?? -1) !== Number(user.token_version || 0)) return res.status(401).json({ message: "Phiên đăng nhập không còn hợp lệ." });
    req.user = user;
    next();
  } catch (error) {
    if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
    }
    return next(error);
  }
}
export function requireAdmin(req, res, next) { if (req.user?.role !== "admin") return res.status(403).json({ message: "Bạn không có quyền quản trị." }); next(); }
