import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { protect } from "../middleware/authMiddleware.js";
import { deleteDocument, getDocumentById, getDocuments, uploadDocument } from "../controllers/documentController.js";
import { fixVietnameseFileName } from "../utils/fileNameEncoding.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) > 0 ? Number(process.env.MAX_UPLOAD_MB) : 10;
const MAX_FILE_SIZE = MAX_UPLOAD_MB * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set([".txt", ".md", ".pdf", ".docx"]);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    file.originalname = fixVietnameseFileName(file.originalname);
    cb(null, `${unique}-${file.originalname}`);
  }
});

function fileFilter(req, file, cb) {
  file.originalname = fixVietnameseFileName(file.originalname);
  const fileExt = path.extname(file.originalname || "").toLowerCase();

  if (!SUPPORTED_EXTENSIONS.has(fileExt)) {
    const error = new Error("Định dạng file không được hỗ trợ.");
    error.statusCode = 400;
    return cb(error);
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

function uploadSingleDocument(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: `Dung lượng file vượt quá giới hạn ${MAX_UPLOAD_MB}MB.` });
    }

    return res.status(error.statusCode || 400).json({
      message: error.message || "Không thể upload tài liệu."
    });
  });
}

const router = express.Router();

router.use(protect);
router.get("/", getDocuments);
router.post("/upload", uploadSingleDocument, uploadDocument);
router.get("/:id", getDocumentById);
router.delete("/:id", deleteDocument);

export default router;
