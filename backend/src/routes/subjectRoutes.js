import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  getSubjects,
  updateSubject
} from "../controllers/subjectController.js";
import { validate } from "../middleware/validate.js";
import { subjectSchema, uuidSchema } from "../schemas/validationSchemas.js";

const router = express.Router();

router.use(protect);
router.get("/", getSubjects);
router.post("/", validate(subjectSchema), createSubject);
router.get("/:id", validate(uuidSchema, "params"), getSubjectById);
router.put("/:id", validate(uuidSchema, "params"), validate(subjectSchema), updateSubject);
router.delete("/:id", validate(uuidSchema, "params"), deleteSubject);

export default router;
