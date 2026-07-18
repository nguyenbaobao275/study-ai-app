import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { retrieveChunks } from "../services/ragService.js";

function excerpt(value, max = 260) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function uniqueById(items) { return [...new Map(items.map((item) => [item.id, item])).values()]; }

async function keywordSearch(q, userId, limit) {
  const pattern = `%${q.replace(/[\\%_]/g, (value) => `\\${value}`)}%`;
  const { data: owned, error: ownedError } = await supabase.from("documents").select("id").eq("user_id", userId);
  if (ownedError) throw ownedError;
  const ids = (owned || []).map((item) => item.id);
  const empty = { documents: [], summaries: [], flashcards: [], quizzes: [] };
  if (!ids.length) return empty;
  const [titleDocs, fileDocs, summaries, cardQuestions, cardAnswers, quizQuestions] = await Promise.all([
    supabase.from("documents").select("id, title, file_name, file_type, subjects(name), created_at").eq("user_id", userId).ilike("title", pattern).limit(limit),
    supabase.from("documents").select("id, title, file_name, file_type, subjects(name), created_at").eq("user_id", userId).ilike("file_name", pattern).limit(limit),
    supabase.from("summaries").select("id, document_id, content, created_at").in("document_id", ids).ilike("content", pattern).limit(limit),
    supabase.from("flashcards").select("id, document_id, question, answer, created_at").in("document_id", ids).ilike("question", pattern).limit(limit),
    supabase.from("flashcards").select("id, document_id, question, answer, created_at").in("document_id", ids).ilike("answer", pattern).limit(limit),
    supabase.from("quizzes").select("id, document_id, question, created_at").in("document_id", ids).ilike("question", pattern).limit(limit)
  ]);
  for (const result of [titleDocs, fileDocs, summaries, cardQuestions, cardAnswers, quizQuestions]) if (result.error) throw result.error;
  return { documents: uniqueById([...(titleDocs.data || []), ...(fileDocs.data || [])]).map((doc) => ({ ...doc, score: 0.35, matched_chunks: [] })),
    summaries: summaries.data || [], flashcards: uniqueById([...(cardQuestions.data || []), ...(cardAnswers.data || [])]), quizzes: quizQuestions.data || [] };
}

async function semanticDocuments(q, userId, limit) {
  const chunks = await retrieveChunks({ question: q, userId, matchCount: Math.min(limit * 3, 30), threshold: 0.25 });
  const grouped = new Map();
  for (const chunk of chunks) {
    const list = grouped.get(chunk.document_id) || [];
    if (list.length < 3) list.push({ chunk_id: chunk.chunk_id, chunk_index: chunk.chunk_index, page_number: chunk.page_number, excerpt: excerpt(chunk.content), similarity: Number(chunk.similarity) });
    grouped.set(chunk.document_id, list);
  }
  const ids = [...grouped.keys()];
  if (!ids.length) return [];
  const { data, error } = await supabase.from("documents").select("id, title, file_name, file_type, subjects(name), created_at").eq("user_id", userId).in("id", ids);
  if (error) throw error;
  return (data || []).map((doc) => ({ ...doc, matched_chunks: grouped.get(doc.id), score: grouped.get(doc.id)?.[0]?.similarity || 0 }))
    .sort((a, b) => b.score - a.score).slice(0, limit);
}

export const searchStudyData = asyncHandler(async (req, res) => {
  const { q, mode, limit } = req.query;
  let keyword = { documents: [], summaries: [], flashcards: [], quizzes: [] };
  let semantic = [];
  let used = mode;
  if (mode !== "semantic") keyword = await keywordSearch(q, req.user.id, limit);
  if (mode !== "keyword") {
    try { semantic = await semanticDocuments(q, req.user.id, limit); }
    catch { used = "keyword_fallback"; if (mode === "semantic") keyword = await keywordSearch(q, req.user.id, limit); }
  }
  const documents = mode === "keyword" || used === "keyword_fallback"
    ? keyword.documents
    : uniqueById([...semantic, ...keyword.documents]).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, limit);
  res.json({ query: q, mode, search_mode_used: used, documents, summaries: keyword.summaries, flashcards: keyword.flashcards, quizzes: keyword.quizzes });
});
