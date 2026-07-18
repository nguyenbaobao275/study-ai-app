import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { searchSchema } from "../schemas/validationSchemas.js";
import { searchStudyData } from "../controllers/searchController.js";
const router = express.Router();
router.use(protect);
router.get("/", validate(searchSchema, "query"), searchStudyData);
export default router;
