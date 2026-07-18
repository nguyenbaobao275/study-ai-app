import { supabase } from "../config/supabase.js";
import { generateEmbedding } from "./embeddingService.js";
import { buildRagPrompt } from "./aiPromptService.js";
import { generateContent, parseJsonFromAI } from "./geminiService.js";

export function validSourceNumbers(value, sourceCount) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter((number) => Number.isInteger(number) && number >= 1 && number <= sourceCount))];
}

function excerpt(content) {
  const text = String(content || "").replace(/\s+/g, " ").trim();
  return text.length > 320 ? `${text.slice(0, 317)}...` : text;
}

export async function retrieveChunks({ question, userId, documentId, matchCount, threshold }) {
  const embedding = await generateEmbedding(question, { taskType: "RETRIEVAL_QUERY" });
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: embedding, match_user_id: userId, match_document_id: documentId || null,
    match_threshold: threshold ?? (Number(process.env.RAG_MATCH_THRESHOLD) || 0.45),
    match_count: matchCount ?? (Number(process.env.RAG_MATCH_COUNT) || 8)
  });
  if (error) throw error;
  return data || [];
}

export async function answerDocumentQuestion({ document, userId, question }) {
  if (document.index_status !== "completed") {
    const error = new Error("Tài liệu chưa lập chỉ mục xong. Hãy lập chỉ mục lại trước khi hỏi.");
    error.statusCode = 409; throw error;
  }
  const sources = await retrieveChunks({ question, userId, documentId: document.id });
  let answer = "Không tìm thấy thông tin này trong tài liệu.";
  let used = [];
  if (sources.length) {
    const parsed = parseJsonFromAI(await generateContent(buildRagPrompt(question, sources)), {});
    answer = typeof parsed.answer === "string" && parsed.answer.trim() ? parsed.answer.trim() : answer;
    used = validSourceNumbers(parsed.used_source_numbers, sources.length);
    if (!used.length) answer = "Không tìm thấy thông tin này trong tài liệu.";
  }
  const citations = used.map((number) => {
    const source = sources[number - 1];
    return { chunk_id: source.chunk_id, document_id: source.document_id, document_title: document.title,
      page_number: source.page_number ?? null, chunk_index: source.chunk_index, excerpt: excerpt(source.content), similarity: Number(source.similarity || 0) };
  });
  const row = { user_id: userId, document_id: document.id, question, answer, citations };
  const { data, error } = await supabase.from("document_chats").insert(row).select("*").single();
  if (error) throw error;
  return { ...data, citations, persisted: true };
}
