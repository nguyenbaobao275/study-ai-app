import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export const register = asyncHandler(async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: existed } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existed) {
    return res.status(409).json({ message: "Email đã được sử dụng" });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data: user, error } = await supabase
    .from("users")
    .insert({ full_name, email: normalizedEmail, password_hash })
    .select("id, full_name, email, created_at")
    .single();

  if (error) throw error;

  res.status(201).json({
    user,
    token: createToken(user.id)
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .single();

  if (error || !user) {
    return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
  }

  res.json({
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      created_at: user.created_at
    },
    token: createToken(user.id)
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
