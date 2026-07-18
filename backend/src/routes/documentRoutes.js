import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { documentIdSchema, uuidSchema, uploadMetadataSchema } from "../schemas/validationSchemas.js";
import { deleteDocument, exportSummaryPdf, getDocumentById, getDocuments, getDownloadUrl, reindexDocument, uploadDocument } from "../controllers/documentController.js";
import { listGenerations } from "../controllers/generationController.js";

const maxUploadMb = Number(process.env.MAX_UPLOAD_MB) || 10;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxUploadMb * 1024 * 1024, files: 1 } });

function receiveFile(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();
    const message = error.code === "LIMIT_FILE_SIZE" ? `File vượt giới hạn ${maxUploadMb}MB.` : "Không thể nhận file tải lên.";
    return res.status(400).json({ success: false, message, details: [] });
  });
}

const router = express.Router();
router.use(protect);
router.get("/", getDocuments);
router.post("/upload", uploadLimiter, receiveFile, validate(uploadMetadataSchema), uploadDocument);
router.get("/:documentId/ai-generations", validate(documentIdSchema, "params"), listGenerations);
router.post("/:id/reindex", validate(uuidSchema, "params"), reindexDocument);
router.get("/:id/download-url", validate(uuidSchema, "params"), getDownloadUrl);
router.get("/:id/export/summary", validate(uuidSchema, "params"), exportSummaryPdf);
router.get("/:id", validate(uuidSchema, "params"), getDocumentById);
router.delete("/:id", validate(uuidSchema, "params"), deleteDocument);
export default router;
