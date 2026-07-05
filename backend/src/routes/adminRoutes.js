import express from "express";
import { getAdminOverview } from "../controllers/adminController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, requireAdmin);
router.get("/", getAdminOverview);

export default router;
