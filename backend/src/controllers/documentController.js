import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { supabase } from "../config/supabase.js";
import { extractTextFromFile } from "../services/documentTextExtractor.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fixVietnameseFileName, normalizeDocumentFileName } from "../utils/fileNameEncoding.js";

const SUPPORTED_EXTENSIONS = new Set([".txt", ".md", ".pdf", ".docx"]);

function deleteUploadedFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export const getDocuments = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("documents")
    .select("*, subjects(name)")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  res.json((data || []).map(normalizeDocumentFileName));
});

export const getDocumentById = asyncHandler(async (req, res) => {
  const documentId = req.params.id;

  const { data: document, error } = await supabase
    .from("documents")
    .select("*, subjects(name)")
    .eq("id", documentId)
    .eq("user_id", req.user.id)
    .single();

  if (error || !document) {
    return res.status(404).json({ message: "Không tìm thấy tài liệu" });
  }

  const [
    { data: summaries },
    { data: flashcards },
    { data: quizzes },
    { data: quizAttempts },
    { data: chats }
  ] = await Promise.all([
    supabase.from("summaries").select("*").eq("document_id", documentId).order("created_at", { ascending: false }),
    supabase.from("flashcards").select("*").eq("document_id", documentId).order("created_at", { ascending: true }),
    supabase.from("quizzes").select("*").eq("document_id", documentId).order("created_at", { ascending: true }),
    supabase
      .from("quiz_attempts")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("document_chats")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: true })
  ]);

  res.json({
    ...normalizeDocumentFileName(document),
    summaries: summaries || [],
    flashcards: flashcards || [],
    quizzes: quizzes || [],
    quizAttempts: quizAttempts || [],
    chats: chats || []
  });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const { title, subject_id } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng chọn file tài liệu." });
  }

  if (!title || !subject_id) {
    deleteUploadedFile(req.file.path);
    return res.status(400).json({ message: "Vui lòng nhập tên tài liệu và chọn môn học." });
  }

  const originalName = fixVietnameseFileName(req.file.originalname);
  const fileExt = path.extname(originalName).toLowerCase();
  const fileType = fileExt.replace(".", "");

  if (!SUPPORTED_EXTENSIONS.has(fileExt)) {
    deleteUploadedFile(req.file.path);
    return res.status(400).json({ message: "Định dạng file không được hỗ trợ." });
  }

  try {
    const extractedText = await extractTextFromFile(req.file.path, originalName, req.file.mimetype);

    const { data, error } = await supabase
      .from("documents")
      .insert({
        title,
        subject_id,
        file_name: originalName,
        file_type: fileType,
        extracted_text: extractedText,
        user_id: req.user.id,
        file_path: req.file.path
      })
      .select("*, subjects(name)")
      .single();

    if (error) throw error;
    res.status(201).json(normalizeDocumentFileName(data));
  } catch (error) {
    deleteUploadedFile(req.file.path);
    throw error;
  }
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const { data: document } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  if (error) throw error;

  deleteUploadedFile(document?.file_path);

  res.json({ message: "Đã xóa tài liệu" });
});

export const exportSummaryPdf = asyncHandler(async (req, res) => {
  const documentId = req.params.id;

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, title")
    .eq("id", documentId)
    .eq("user_id", req.user.id)
    .single();

  if (documentError || !document) {
    return res.status(404).json({ message: "Không tìm thấy tài liệu" });
  }

  const { data: summary, error: summaryError } = await supabase
    .from("summaries")
    .select("content, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (summaryError) throw summaryError;
  if (!summary) {
    return res.status(404).json({ message: "Tài liệu chưa có bản tóm tắt để xuất PDF" });
  }

  const pdf = new PDFDocument({ margin: 50, size: "A4" });
  const safeName = document.title.replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/^-|-$/g, "") || "summary";
  const vietnameseFont = "C:/Windows/Fonts/arial.ttf";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}-summary.pdf"`);

  pdf.pipe(res);
  if (fs.existsSync(vietnameseFont)) {
    pdf.font(vietnameseFont);
  }
  pdf.fontSize(18).text(document.title, { align: "center" });
  pdf.moveDown(0.5);
  pdf.fontSize(11).fillColor("#555").text(`Generated at: ${new Date(summary.created_at).toLocaleString("vi-VN")}`);
  pdf.moveDown();
  pdf.fillColor("#111").fontSize(12).text(summary.content, { align: "left", lineGap: 5 });
  pdf.end();
});
