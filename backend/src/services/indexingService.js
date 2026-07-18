import { supabase } from "../config/supabase.js";
import { chunkDocument } from "./documentChunkService.js";
import { generateEmbeddings } from "./embeddingService.js";

function publicError(error) {
  return String(error?.message || "Lập chỉ mục thất bại.").slice(0, 300);
}

export async function indexDocument(document) {
  await supabase.from("documents").update({ index_status: "processing", index_error: null }).eq("id", document.id).eq("user_id", document.user_id);
  const chunks = chunkDocument(document.extracted_text);
  try {
    if (!chunks.length) throw new Error("Tài liệu không tạo được đoạn nội dung hợp lệ.");
    const embeddings = await generateEmbeddings(chunks.map((chunk) => chunk.content));
    const rows = chunks.map((chunk, index) => ({ ...chunk, document_id: document.id, user_id: document.user_id, embedding: embeddings[index] }));
    const { error: deleteError } = await supabase.from("document_chunks").delete().eq("document_id", document.id).eq("user_id", document.user_id);
    if (deleteError) throw deleteError;
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await supabase.from("document_chunks").insert(rows.slice(i, i + 100));
      if (error) throw error;
    }
    const indexedAt = new Date().toISOString();
    await supabase.from("documents").update({ index_status: "completed", index_error: null, indexed_at: indexedAt }).eq("id", document.id).eq("user_id", document.user_id);
    return { status: "completed", chunk_count: chunks.length, indexed_at: indexedAt };
  } catch (error) {
    await supabase.from("document_chunks").delete().eq("document_id", document.id).eq("user_id", document.user_id);
    await supabase.from("documents").update({ index_status: "failed", index_error: publicError(error), indexed_at: null }).eq("id", document.id).eq("user_id", document.user_id);
    throw error;
  }
}
