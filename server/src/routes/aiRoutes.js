import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { generateFlashcards, generateQuizzes, summarizeDocument } from "../controllers/aiController.js";

const router = express.Router();

router.use(protect);
router.post("/summarize/:documentId", summarizeDocument);
router.post("/flashcards/:documentId", generateFlashcards);
router.post("/quizzes/:documentId", generateQuizzes);

export default router;
