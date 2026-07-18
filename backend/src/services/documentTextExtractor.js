import path from "node:path";
import fs from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const SUPPORTED_EXTENSIONS = new Set([".txt", ".md", ".pdf", ".docx"]);

function extractionError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizeText(text) {
  const normalized = String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/^--\s*\d+\s+of\s+\d+\s*--$/gim, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const maxChars = Number(process.env.MAX_EXTRACTED_TEXT_CHARS) || 2_000_000;
  if (normalized.length > maxChars) {
    throw extractionError(`Tài liệu vượt giới hạn ${maxChars.toLocaleString("vi-VN")} ký tự sau khi trích xuất.`);
  }
  if (!normalized) throw extractionError("Tài liệu không có nội dung văn bản có thể đọc.");
  return normalized;
}

async function extractPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy();
  }
}

export async function extractTextFromBuffer(buffer, originalName) {
  const extension = path.extname(originalName || "").toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(extension)) throw extractionError("Định dạng file không được hỗ trợ.");
  try {
    if (extension === ".txt" || extension === ".md") return normalizeText(buffer.toString("utf8"));
    if (extension === ".pdf") return normalizeText(await extractPdf(buffer));
    const result = await mammoth.extractRawText({ buffer });
    return normalizeText(result.value);
  } catch (error) {
    if (error.statusCode) throw error;
    throw extractionError("Không thể trích xuất nội dung từ tài liệu này.");
  }
}

export async function extractTextFromFile(filePath, originalName) {
  return extractTextFromBuffer(await fs.readFile(filePath), originalName);
}
