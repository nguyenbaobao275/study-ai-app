import crypto from "node:crypto";
import fs from "node:fs";
import PDFDocument from "pdfkit";
import sanitize from "sanitize-filename";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { extractTextFromBuffer } from "../services/documentTextExtractor.js";
import { assertFound, assertOwnedSubject, getOwnedDocument } from "../services/ownershipService.js";
import { createSignedDownloadUrl, removeLegacyFile, removeStoredDocument, safeFileName, storagePathFor, uploadDocumentBuffer } from "../services/storageService.js";
import { validateDocumentFile } from "../services/fileValidationService.js";
import { indexDocument } from "../services/indexingService.js";

function publicQuiz(quiz) {
  const { correct_answer, explanation, ...safe } = quiz;
  return safe;
}

async function activeGenerations(documentId) {
  const { data, error } = await supabase.from("ai_generations").select("*").eq("document_id", documentId).eq("is_active", true);
  if (error) throw error;
  return Object.fromEntries((data || []).map((item) => [item.content_type, item]));
}

export const getDocuments = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("documents").select("*, subjects(name)").eq("user_id", req.user.id).order("created_at", { ascending: false });
  if (error) throw error;
  res.json(data || []);
});

export const getDocumentById = asyncHandler(async (req, res) => {
  const document = assertFound(await getOwnedDocument(req.params.id, req.user.id, "*, subjects(name)"), "Không tìm thấy tài liệu.");
  const active = await activeGenerations(document.id);
  const [summaryResult, flashcardResult, quizResult, attemptResult, chatResult] = await Promise.all([
    active.summary ? supabase.from("summaries").select("*").eq("generation_id", active.summary.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    active.flashcards ? supabase.from("flashcards").select("*").eq("generation_id", active.flashcards.id).order("created_at") : Promise.resolve({ data: [] }),
    active.quiz ? supabase.from("quizzes").select("id, document_id, generation_id, question, option_a, option_b, option_c, option_d, created_at, updated_at").eq("generation_id", active.quiz.id).order("created_at") : Promise.resolve({ data: [] }),
    supabase.from("quiz_attempts").select("*").eq("document_id", document.id).eq("user_id", req.user.id).order("created_at", { ascending: false }),
    supabase.from("document_chats").select("*").eq("document_id", document.id).eq("user_id", req.user.id).order("created_at")
  ]);
  for (const result of [summaryResult, flashcardResult, quizResult, attemptResult, chatResult]) if (result.error) throw result.error;
  res.json({ ...document, active_generations: active, summaries: summaryResult.data || [], flashcards: flashcardResult.data || [],
    quizzes: (quizResult.data || []).map(publicQuiz), quizAttempts: attemptResult.data || [], chats: chatResult.data || [] });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Vui lòng chọn file tài liệu." });
  await assertOwnedSubject(req.body.subject_id, req.user.id);
  const fileInfo = await validateDocumentFile(req.file);
  const extractedText = await extractTextFromBuffer(req.file.buffer, fileInfo.originalName, fileInfo.contentType);
  const documentId = crypto.randomUUID();
  const storagePath = storagePathFor(req.user.id, documentId, fileInfo.originalName);
  await uploadDocumentBuffer(storagePath, req.file.buffer, fileInfo.contentType);
  const { data: document, error } = await supabase.from("documents").insert({
    id: documentId, user_id: req.user.id, subject_id: req.body.subject_id, title: req.body.title,
    file_name: fileInfo.originalName, file_type: fileInfo.fileType, file_path: null, storage_path: storagePath,
    extracted_text: extractedText, index_status: "processing", index_error: null
  }).select("*, subjects(name)").single();
  if (error) { await removeStoredDocument(storagePath); throw error; }
  try {
    const indexing = await indexDocument(document);
    res.status(201).json({ ...document, index_status: indexing.status, indexed_at: indexing.indexed_at, chunk_count: indexing.chunk_count });
  } catch (indexError) {
    const { data: failed } = await supabase.from("documents").select("*, subjects(name)").eq("id", document.id).single();
    res.status(201).json({ ...failed, warning: "File đã lưu nhưng lập chỉ mục thất bại. Bạn có thể thử lại." });
  }
});

export const reindexDocument = asyncHandler(async (req, res) => {
  const document = assertFound(await getOwnedDocument(req.params.id, req.user.id), "Không tìm thấy tài liệu.");
  const result = await indexDocument(document);
  res.json(result);
});

export const getDownloadUrl = asyncHandler(async (req, res) => {
  const document = assertFound(await getOwnedDocument(req.params.id, req.user.id, "id, storage_path, file_path"), "Không tìm thấy tài liệu.");
  if (!document.storage_path) return res.status(409).json({ message: "Tài liệu cũ chưa được chuyển lên Supabase Storage." });
  res.json({ url: await createSignedDownloadUrl(document.storage_path), expires_in: 300 });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const document = assertFound(await getOwnedDocument(req.params.id, req.user.id, "id, storage_path, file_path"), "Không tìm thấy tài liệu.");
  if (document.storage_path) await removeStoredDocument(document.storage_path);
  const { error } = await supabase.from("documents").delete().eq("id", document.id).eq("user_id", req.user.id);
  if (error) throw error;
  if (document.file_path) await removeLegacyFile(document.file_path);
  res.json({ message: "Đã xóa tài liệu." });
});

export const exportSummaryPdf = asyncHandler(async (req, res) => {
  const document = assertFound(await getOwnedDocument(req.params.id, req.user.id, "id, title"), "Không tìm thấy tài liệu.");
  let query = supabase.from("summaries").select("content, created_at, generation_id").eq("document_id", document.id);
  if (req.query.generation_id) query = query.eq("generation_id", req.query.generation_id);
  else {
    const active = await activeGenerations(document.id);
    if (!active.summary) return res.status(404).json({ message: "Tài liệu chưa có bản tóm tắt đang sử dụng." });
    query = query.eq("generation_id", active.summary.id);
  }
  const { data: summary, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  if (!summary) return res.status(404).json({ message: "Không tìm thấy bản tóm tắt." });
  const pdf = new PDFDocument({ margin: 50, size: "A4" });
  const asciiName = safeFileName(document.title) || "summary";
  const encodedTitle = encodeURIComponent(`${document.title || "summary"}-summary.pdf`);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${asciiName}-summary.pdf"; filename*=UTF-8''${encodedTitle}`);
  pdf.pipe(res);
  const fontPath = String(process.env.PDF_FONT_PATH || "").trim();
  if (fontPath && fs.existsSync(fontPath)) pdf.font(fontPath);
  pdf.fontSize(18).text(document.title, { align: "center" });
  pdf.moveDown().fontSize(12).text(summary.content, { lineGap: 5 });
  pdf.end();
});
