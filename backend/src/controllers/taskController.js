import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertOwnedSubject } from "../services/ownershipService.js";

export const getTasks = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, subjects(name)")
    .eq("user_id", req.user.id)
    .order("due_date", { ascending: true });

  if (error) throw error;
  res.json(data);
});

export const createTask = asyncHandler(async (req, res) => {
  const { subject_id, title, description, due_date } = req.body;
  await assertOwnedSubject(subject_id || null, req.user.id);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: req.user.id,
      subject_id: subject_id || null,
      title,
      description,
      due_date,
      status: "pending"
    })
    .select("*, subjects(name)")
    .single();

  if (error) throw error;
  res.status(201).json(data);
});

export const updateTask = asyncHandler(async (req, res) => {
  const { subject_id, title, description, due_date, status } = req.body;
  await assertOwnedSubject(subject_id || null, req.user.id);

  const { data, error } = await supabase
    .from("tasks")
    .update({ subject_id: subject_id || null, title, description, due_date, status })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("*, subjects(name)")
    .single();

  if (error || !data) return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
  res.json(data);
});

export const completeTask = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "completed" })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("*, subjects(name)")
    .single();

  if (error || !data) return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
  res.json(data);
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  if (error) throw error;
  res.json({ message: "Đã xóa nhiệm vụ" });
});
