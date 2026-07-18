import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import sanitize from "sanitize-filename";
import { fixVietnameseFileName } from "../utils/fileNameEncoding.js";

const allowed = new Set([".txt", ".md", ".pdf", ".docx"]);

export async function validateDocumentFile(file) {
  if (!file?.buffer?.length) throw Object.assign(new Error("File tải lên đang rỗng."), { statusCode: 400 });
  const originalName = sanitize(path.basename(fixVietnameseFileName(file.originalname || "document"))) || "document";
  const extension = path.extname(originalName).toLowerCase();
  if (!allowed.has(extension)) throw Object.assign(new Error("Chỉ hỗ trợ TXT, Markdown, PDF và DOCX."), { statusCode: 400 });
  const detected = await fileTypeFromBuffer(file.buffer);
  const mime = String(file.mimetype || "").toLowerCase();
  const mimeAllowed = extension === ".pdf" ? ["application/pdf", "application/octet-stream"]
    : extension === ".docx" ? ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/octet-stream"]
      : ["text/plain", "text/markdown", "text/x-markdown", "application/octet-stream", ""];
  if (!mimeAllowed.includes(mime)) throw Object.assign(new Error("MIME type của file không phù hợp với phần mở rộng."), { statusCode: 400 });
  if (extension === ".pdf" && detected?.ext !== "pdf") throw Object.assign(new Error("Nội dung file không phải PDF hợp lệ."), { statusCode: 400 });
  if (extension === ".docx" && !["docx", "zip"].includes(detected?.ext)) throw Object.assign(new Error("Nội dung file không phải DOCX hợp lệ."), { statusCode: 400 });
  if ([".txt", ".md"].includes(extension) && file.buffer.includes(0)) throw Object.assign(new Error("File văn bản chứa dữ liệu nhị phân không hợp lệ."), { statusCode: 400 });
  return { originalName, extension, fileType: extension.slice(1), contentType: file.mimetype || detected?.mime || "application/octet-stream" };
}
