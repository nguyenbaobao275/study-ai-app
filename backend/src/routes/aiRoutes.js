import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  askDocument,
  generateFlashcards,
  generateQuizzes,
  generateStudyPlan,
  submitQuizAttempt,
  summarizeDocument
} from "../controllers/aiController.js";

const router = express.Router();

router.use(protect);
router.post("/summarize/:documentId", summarizeDocument);
router.post("/flashcards/:documentId", generateFlashcards);
router.post("/quizzes/:documentId", generateQuizzes);
router.post("/quiz-attempts/:documentId", submitQuizAttempt);
router.post("/chat/:documentId", askDocument);
router.post("/study-plan", generateStudyPlan);

export default router;
