import fs from "node:fs/promises";
import path from "node:path";
import sanitize from "sanitize-filename";
import { supabase } from "../config/supabase.js";

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "study-documents";

export function safeFileName(name) {
  const ext = path.extname(String(name || ""));
  const base = path.basename(String(name || ""), ext);
  const asciiBase = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const asciiExt = ext.replace(/[^a-zA-Z0-9.]/g, "").toLowerCase();
  return (asciiBase || "document") + asciiExt;
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
  if (error) {
    console.error("Storage upload error:", error);
    const err = new Error("Không thể lưu file vào kho tài liệu riêng tư.");
    err.publicMessage = "Không thể lưu file vào kho tài liệu riêng tư.";
    throw err;
  }
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

