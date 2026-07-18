import { supabase } from "../config/supabase.js";

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

export async function getOwnedDocument(documentId, userId, columns = "*") {
  const { data, error } = await supabase.from("documents").select(columns).eq("id", documentId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getOwnedSubject(subjectId, userId) {
  const { data, error } = await supabase.from("subjects").select("*").eq("id", subjectId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getOwnedGeneration(generationId, userId) {
  const { data, error } = await supabase.from("ai_generations").select("*").eq("id", generationId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function assertOwnedSubject(subjectId, userId) {
  if (!subjectId) return null;
  const subject = await getOwnedSubject(subjectId, userId);
  if (!subject) throw notFound("Không tìm thấy môn học thuộc tài khoản của bạn.");
  return subject;
}

export function assertFound(value, message = "Không tìm thấy dữ liệu.") {
  if (!value) throw notFound(message);
  return value;
}
