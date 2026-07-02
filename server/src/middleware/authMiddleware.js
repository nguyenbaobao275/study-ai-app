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

    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, created_at")
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: "Tài khoản không tồn tại" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}
