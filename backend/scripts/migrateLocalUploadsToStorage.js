import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { supabase } from "../src/config/supabase.js";
import { storagePathFor, uploadDocumentBuffer } from "../src/services/storageService.js";

dotenv.config();
let migrated = 0;
let failed = 0;
const { data: documents, error } = await supabase.from("documents").select("id, user_id, file_name, file_type, file_path, storage_path").not("file_path", "is", null).is("storage_path", null);
if (error) throw error;
for (const document of documents || []) {
  try {
    const buffer = await fs.readFile(path.resolve(document.file_path));
    const storagePath = storagePathFor(document.user_id, document.id, document.file_name);
    await uploadDocumentBuffer(storagePath, buffer, undefined);
    const { error: updateError } = await supabase.from("documents").update({ storage_path: storagePath }).eq("id", document.id).is("storage_path", null);
    if (updateError) throw updateError;
    migrated += 1;
  } catch (migrationError) {
    failed += 1;
    console.error(`Không thể chuyển document ${document.id}: ${migrationError.message}`);
  }
}
console.log(`Hoàn tất: ${migrated} file thành công, ${failed} file thất bại.`);

