import { supabase } from "../config/supabase.js";
import { generateContent, parseJsonFromAI } from "./geminiService.js";
import { buildFlashcardPrompt, buildQuizPrompt, buildSummaryPrompt, buildSynthesisPrompt } from "./aiPromptService.js";
import { chunkDocument, selectDistributedChunks } from "./documentChunkService.js";
import { validateQuizzes } from "./quizService.js";

function shortError(error) { return String(error?.message || "Tạo nội dung thất bại.").slice(0, 300); }

async function nextVersion(documentId, contentType) {
  const { data, error } = await supabase.from("ai_generations").select("version_number").eq("document_id", documentId).eq("content_type", contentType).order("version_number", { ascending: false }).limit(1);
  if (error) throw error;
  return Number(data?.[0]?.version_number || 0) + 1;
}

async function activate(generationId, userId) {
  const { data, error } = await supabase.rpc("activate_ai_generation", { target_generation_id: generationId, owner_user_id: userId });
  if (error) throw error;
  return data;
}

async function sourceSections(document, max = 12) {
  const { data } = await supabase.from("document_chunks").select("chunk_index, content").eq("document_id", document.id).eq("user_id", document.user_id).order("chunk_index");
  const chunks = data?.length ? data : chunkDocument(document.extracted_text);
  return (max ? selectDistributedChunks(chunks, max) : chunks).map((chunk) => chunk.content);
}

function groupSections(sections, maxChars = 60_000) {
  const groups = [];
  let current = [];
  let size = 0;
  for (const section of sections) {
    if (current.length && size + section.length > maxChars) { groups.push(current.join("\n\n")); current = []; size = 0; }
    current.push(section); size += section.length;
  }
  if (current.length) groups.push(current.join("\n\n"));
  return groups;
}

async function withGeneration(document, contentType, config, producer) {
  const versionNumber = await nextVersion(document.id, contentType);
  const { data: generation, error } = await supabase.from("ai_generations").insert({
    user_id: document.user_id, document_id: document.id, content_type: contentType,
    version_number: versionNumber, status: "processing", source: "ai", config, is_active: false
  }).select("*").single();
  if (error) throw error;
  try {
    const content = await producer(generation);
    const { error: statusError } = await supabase.from("ai_generations").update({ status: "completed", error_message: null, updated_at: new Date().toISOString() }).eq("id", generation.id);
    if (statusError) throw statusError;
    await activate(generation.id, document.user_id);
    return { generation: { ...generation, status: "completed", is_active: true }, content };
  } catch (producerError) {
    await supabase.from("summaries").delete().eq("generation_id", generation.id);
    await supabase.from("flashcards").delete().eq("generation_id", generation.id);
    await supabase.from("quizzes").delete().eq("generation_id", generation.id);
    await supabase.from("ai_generations").update({ status: "failed", error_message: shortError(producerError), updated_at: new Date().toISOString() }).eq("id", generation.id);
    throw producerError;
  }
}

export async function generateSummaryVersion(document) {
  return withGeneration(document, "summary", {}, async (generation) => {
    const sections = await sourceSections(document, null);
    let content;
    if (sections.join("\n\n").length <= 60_000) content = await generateContent(buildSummaryPrompt(sections.join("\n\n")));
    else {
      const partials = [];
      for (const group of groupSections(sections)) partials.push(await generateContent(buildSummaryPrompt(group)));
      content = await generateContent(buildSynthesisPrompt(partials));
    }
    if (!content?.trim()) throw new Error("AI không trả về bản tóm tắt hợp lệ.");
    const { data, error } = await supabase.from("summaries").insert({ document_id: document.id, generation_id: generation.id, summary_type: "ai_summary", content: content.trim() }).select("*").single();
    if (error) throw error;
    return data;
  });
}

export async function generateFlashcardVersion(document, requestedCount = 10) {
  const count = Math.min(30, Math.max(1, Number(requestedCount) || 10));
  return withGeneration(document, "flashcards", { requested_count: count }, async (generation) => {
    const text = (await sourceSections(document)).join("\n\n");
    const parsed = parseJsonFromAI(await generateContent(buildFlashcardPrompt(text, count)), []);
    const cards = (Array.isArray(parsed) ? parsed : []).filter((item) => String(item?.question || "").trim() && String(item?.answer || "").trim()).slice(0, count);
    if (!cards.length) throw new Error("AI không trả về flashcard hợp lệ.");
    const rows = cards.map((item) => ({ document_id: document.id, generation_id: generation.id, question: String(item.question).trim(), answer: String(item.answer).trim() }));
    const { data, error } = await supabase.from("flashcards").insert(rows).select("*");
    if (error) throw error;
    return data;
  });
}

export async function generateQuizVersion(document, questionCount = 5) {
  const count = Math.min(30, Math.max(1, Number(questionCount) || 5));
  return withGeneration(document, "quiz", { question_count: count }, async (generation) => {
    const text = (await sourceSections(document)).join("\n\n");
    let quizzes = validateQuizzes(parseJsonFromAI(await generateContent(buildQuizPrompt(text, count)), []), count);
    if (quizzes.length < count) {
      const supplement = validateQuizzes(parseJsonFromAI(await generateContent(buildQuizPrompt(text, count - quizzes.length, quizzes.map((item) => item.question))), []), count);
      quizzes = validateQuizzes([...quizzes, ...supplement], count);
    }
    if (quizzes.length < count) throw new Error(`AI chỉ tạo được ${quizzes.length}/${count} câu hỏi hợp lệ. Vui lòng thử lại.`);
    const rows = quizzes.map((item) => ({ ...item, document_id: document.id, generation_id: generation.id }));
    const { data, error } = await supabase.from("quizzes").insert(rows).select("*");
    if (error) throw error;
    return data;
  });
}

export async function activateGeneration(generationId, userId) { return activate(generationId, userId); }
