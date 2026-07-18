import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function createToken(user) {
  return jwt.sign({ id: user.id, tokenVersion: Number(user.token_version || 0) }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}
function publicUser(user) { return { id: user.id, full_name: user.full_name, email: user.email, role: user.role || "user", created_at: user.created_at }; }

export const register = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const { data: existed } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  if (existed) return res.status(409).json({ message: "Email đã được sử dụng." });
  const { data: user, error } = await supabase.from("users").insert({ full_name: req.body.full_name, email, password_hash: await bcrypt.hash(req.body.password, 10) })
    .select("id, full_name, email, role, token_version, created_at").single();
  if (error) throw error;
  res.status(201).json({ user: publicUser(user), token: createToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase.from("users").select("*").eq("email", req.body.email.toLowerCase()).maybeSingle();
  if (error || !user || !await bcrypt.compare(req.body.password, user.password_hash)) return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
  res.json({ user: publicUser(user), token: createToken(user) });
});

export const logout = asyncHandler(async (req, res) => {
  const { error } = await supabase.from("users").update({ token_version: Number(req.user.token_version || 0) + 1 }).eq("id", req.user.id);
  if (error) throw error;
  res.json({ message: "Đã đăng xuất khỏi tài khoản." });
});
export const me = asyncHandler(async (req, res) => res.json({ user: publicUser(req.user) }));
