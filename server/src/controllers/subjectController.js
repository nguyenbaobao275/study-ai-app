import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSubjects = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  res.json(data);
});

export const getSubjectById = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();

  if (error || !data) return res.status(404).json({ message: "Không tìm thấy môn học" });
  res.json(data);
});

export const createSubject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Tên môn học không được để trống" });
  }

  const { data, error } = await supabase
    .from("subjects")
    .insert({ user_id: req.user.id, name, description })
    .select("*")
    .single();

  if (error) throw error;
  res.status(201).json(data);
});

export const updateSubject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const { data, error } = await supabase
    .from("subjects")
    .update({ name, description })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("*")
    .single();

  if (error || !data) return res.status(404).json({ message: "Không tìm thấy môn học" });
  res.json(data);
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  if (error) throw error;
  res.json({ message: "Đã xóa môn học" });
});
