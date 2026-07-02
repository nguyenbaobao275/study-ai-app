import fs from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const SUPPORTED_EXTENSIONS = new Set([".txt", ".md", ".pdf", ".docx"]);
const MAX_EXTRACTED_TEXT_LENGTH = 100000;

function createExtractionError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(text) {
  return (text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/^--\s*\d+\s+of\s+\d+\s*--$/gim, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_EXTRACTED_TEXT_LENGTH);
}

async function extractPdfText(filePath) {
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy();
  }
}

export async function extractTextFromFile(filePath, originalName, mimetype) {
  const fileExt = path.extname(originalName || "").toLowerCase();

  if (!SUPPORTED_EXTENSIONS.has(fileExt)) {
    throw createExtractionError("Định dạng file không được hỗ trợ.");
  }

  let rawText = "";

  try {
    if (fileExt === ".txt" || fileExt === ".md") {
      // Đọc nội dung text/markdown trực tiếp từ file.
      rawText = await fs.readFile(filePath, "utf8");
    } else if (fileExt === ".pdf") {
      // Trích xuất text có thể sao chép từ PDF.
      rawText = await extractPdfText(filePath);
    } else if (fileExt === ".docx") {
      // Chuyển DOCX sang plain text bằng mammoth.
      const result = await mammoth.extractRawText({ path: filePath });
      rawText = result.value || "";
    }
  } catch (error) {
    throw createExtractionError("Không thể trích xuất nội dung từ tài liệu.");
  }

  const extractedText = normalizeText(rawText);

  if (!extractedText && fileExt === ".pdf") {
    throw createExtractionError("Không thể trích xuất nội dung. Vui lòng dùng tài liệu có văn bản có thể sao chép.");
  }

  if (!extractedText) {
    throw createExtractionError("Tài liệu không có nội dung.");
  }

  return extractedText;
}
