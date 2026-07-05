import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { searchStudyData } from "../controllers/searchController.js";

const router = express.Router();

router.use(protect);
router.get("/", searchStudyData);

export default router;
