import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { completeTask, createTask, deleteTask, getTasks, updateTask } from "../controllers/taskController.js";
import { validate } from "../middleware/validate.js";
import { taskSchema, uuidSchema } from "../schemas/validationSchemas.js";

const router = express.Router();

router.use(protect);
router.get("/", getTasks);
router.post("/", validate(taskSchema), createTask);
router.put("/:id", validate(uuidSchema, "params"), validate(taskSchema), updateTask);
router.patch("/:id/complete", validate(uuidSchema, "params"), completeTask);
router.delete("/:id", validate(uuidSchema, "params"), deleteTask);

export default router;
