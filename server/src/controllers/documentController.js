import fs from "fs";
import path from "path";
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

  const [{ data: summaries }, { data: flashcards }, { data: quizzes }] = await Promise.all([
    supabase.from("summaries").select("*").eq("document_id", documentId).order("created_at", { ascending: false }),
    supabase.from("flashcards").select("*").eq("document_id", documentId).order("created_at", { ascending: true }),
    supabase.from("quizzes").select("*").eq("document_id", documentId).order("created_at", { ascending: true })
  ]);

  res.json({
    ...normalizeDocumentFileName(document),
    summaries: summaries || [],
    flashcards: flashcards || [],
    quizzes: quizzes || []
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
