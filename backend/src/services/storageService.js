import fs from "node:fs/promises";
import path from "node:path";
import sanitize from "sanitize-filename";
import { supabase } from "../config/supabase.js";

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "study-documents";

export function safeFileName(name) {
  const cleaned = sanitize(path.basename(String(name || "document"))).replace(/\s+/g, "-");
  return cleaned || "document";
}

export function storagePathFor(userId, documentId, fileName) {
  return `${userId}/${documentId}/${safeFileName(fileName)}`;
}

export async function uploadDocumentBuffer(storagePath, buffer, contentType) {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: false,
    cacheControl: "3600"
  });
  if (error) throw new Error("Không thể lưu file vào kho tài liệu riêng tư.");
  return storagePath;
}

export async function createSignedDownloadUrl(storagePath, expiresIn = 300) {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(storagePath, expiresIn);
  if (error || !data?.signedUrl) throw new Error("Không thể tạo liên kết tải file.");
  return data.signedUrl;
}

export async function removeStoredDocument(storagePath) {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
  if (error) throw new Error("Không thể xóa file khỏi kho lưu trữ.");
}

export async function removeLegacyFile(filePath) {
  if (!filePath) return;
  try { await fs.unlink(path.resolve(filePath)); } catch (error) { if (error.code !== "ENOENT") throw error; }
}

