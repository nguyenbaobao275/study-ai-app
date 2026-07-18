import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertFound, getOwnedDocument, getOwnedGeneration } from "../services/ownershipService.js";
import { activateGeneration } from "../services/aiGenerationService.js";

const tableForType = { summary: "summaries", flashcards: "flashcards", quiz: "quizzes" };

async function generationContent(generation) {
  const table = tableForType[generation.content_type];
  const { data, error } = await supabase.from(table).select("*").eq("generation_id", generation.id).order("created_at", { ascending: true });
  if (error) throw error;
  return generation.content_type === "summary" ? data?.[0] || null : data || [];
}

export const listGenerations = asyncHandler(async (req, res) => {
  assertFound(await getOwnedDocument(req.params.documentId, req.user.id, "id"), "Không tìm thấy tài liệu.");
  let query = supabase.from("ai_generations").select("*").eq("document_id", req.params.documentId).eq("user_id", req.user.id).order("created_at", { ascending: false });
  if (req.query.type) query = query.eq("content_type", req.query.type);
  const { data, error } = await query;
  if (error) throw error;
  res.json(data || []);
});

export const getGeneration = asyncHandler(async (req, res) => {
  const generation = assertFound(await getOwnedGeneration(req.params.generationId, req.user.id), "Không tìm thấy phiên bản.");
  res.json({ ...generation, content: await generationContent(generation) });
});

export const activateGenerationController = asyncHandler(async (req, res) => {
  const generation = assertFound(await getOwnedGeneration(req.params.generationId, req.user.id), "Không tìm thấy phiên bản.");
  if (generation.status !== "completed") return res.status(409).json({ message: "Chỉ có thể dùng phiên bản đã hoàn tất." });
  await activateGeneration(generation.id, req.user.id);
  res.json({ message: "Đã đổi phiên bản đang sử dụng." });
});

export const deleteGeneration = asyncHandler(async (req, res) => {
  const generation = assertFound(await getOwnedGeneration(req.params.generationId, req.user.id), "Không tìm thấy phiên bản.");
  if (generation.status === "processing") return res.status(409).json({ message: "Không thể xóa phiên bản đang xử lý." });
  const { error } = await supabase.from("ai_generations").delete().eq("id", generation.id).eq("user_id", req.user.id);
  if (error) throw error;
  if (generation.is_active) {
    const { data: replacement } = await supabase.from("ai_generations").select("id").eq("document_id", generation.document_id).eq("content_type", generation.content_type).eq("status", "completed").order("version_number", { ascending: false }).limit(1).maybeSingle();
    if (replacement) await activateGeneration(replacement.id, req.user.id);
  }
  res.json({ message: "Đã xóa phiên bản." });
});

function editContent(table, schemaFields) {
  return asyncHandler(async (req, res) => {
    const { data: item, error: findError } = await supabase.from(table).select("id, document_id, generation_id").eq("id", req.params.id).maybeSingle();
    if (findError) throw findError;
    assertFound(item, "Không tìm thấy nội dung.");
    assertFound(await getOwnedDocument(item.document_id, req.user.id, "id"), "Không tìm thấy nội dung.");
    const changes = Object.fromEntries(schemaFields.filter((key) => key in req.body).map((key) => [key, req.body[key]]));
    const { data, error } = await supabase.from(table).update({ ...changes, updated_at: new Date().toISOString() }).eq("id", item.id).select("*").single();
    if (error) throw error;
    res.json(data);
  });
}

export const editSummary = editContent("summaries", ["content"]);
export const editFlashcard = editContent("flashcards", ["question", "answer"]);
export const editQuiz = editContent("quizzes", ["question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation"]);

