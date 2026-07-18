import express from "express";
import { askDocument, generateFlashcards, generateQuizzes, submitQuizAttempt, summarizeDocument } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import { aiLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { chatSchema, documentIdSchema, quizCountSchema, quizSubmissionSchema } from "../schemas/validationSchemas.js";

const router = express.Router();
router.use(protect, aiLimiter);
router.post("/summarize/:documentId", validate(documentIdSchema, "params"), summarizeDocument);
router.post("/flashcards/:documentId", validate(documentIdSchema, "params"), generateFlashcards);
router.post("/quizzes/:documentId", validate(documentIdSchema, "params"), validate(quizCountSchema), generateQuizzes);
router.post("/quiz-attempts/:documentId", validate(documentIdSchema, "params"), validate(quizSubmissionSchema), submitQuizAttempt);
router.post("/chat/:documentId", validate(documentIdSchema, "params"), validate(chatSchema), askDocument);
export default router;
