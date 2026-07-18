import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { generationIdSchema, uuidSchema, summaryEditSchema, flashcardEditSchema, quizEditSchema } from "../schemas/validationSchemas.js";
import { activateGenerationController, deleteGeneration, editFlashcard, editQuiz, editSummary, getGeneration } from "../controllers/generationController.js";

const router = express.Router();
router.use(protect);
router.get("/ai-generations/:generationId", validate(generationIdSchema, "params"), getGeneration);
router.patch("/ai-generations/:generationId/activate", validate(generationIdSchema, "params"), activateGenerationController);
router.delete("/ai-generations/:generationId", validate(generationIdSchema, "params"), deleteGeneration);
router.patch("/summaries/:id", validate(uuidSchema, "params"), validate(summaryEditSchema), editSummary);
router.patch("/flashcards/:id", validate(uuidSchema, "params"), validate(flashcardEditSchema), editFlashcard);
router.patch("/quizzes/:id", validate(uuidSchema, "params"), validate(quizEditSchema), editQuiz);
export default router;
