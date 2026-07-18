import { z } from "zod";

export const uuidSchema = z.object({ id: z.string().uuid("ID không hợp lệ") }).passthrough();
export const documentIdSchema = z.object({ documentId: z.string().uuid("ID tài liệu không hợp lệ") }).passthrough();
export const generationIdSchema = z.object({ generationId: z.string().uuid("ID phiên bản không hợp lệ") }).passthrough();

export const registerSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(6).max(128)
});
export const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) });
export const subjectSchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(1000).optional().default("") });
export const taskSchema = z.object({
  subject_id: z.union([z.string().uuid(), z.literal("")]).optional().default(""),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().default(""),
  due_date: z.string().date(),
  status: z.enum(["pending", "completed", "overdue"]).optional()
});
export const uploadMetadataSchema = z.object({ title: z.string().trim().min(1).max(200), subject_id: z.string().uuid() });
export const chatSchema = z.object({ question: z.string().trim().min(2).max(1000) });
export const quizCountSchema = z.object({ question_count: z.coerce.number().int().min(1).max(30).default(5) });
export const quizSubmissionSchema = z.object({
  generation_id: z.string().uuid(),
  answers: z.record(z.string().uuid(), z.enum(["A", "B", "C", "D"]))
});
export const summaryEditSchema = z.object({ content: z.string().trim().min(1).max(100000) });
export const flashcardEditSchema = z.object({ question: z.string().trim().min(1).max(1000), answer: z.string().trim().min(1).max(5000) });
export const quizEditSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  option_a: z.string().trim().min(1).max(1000), option_b: z.string().trim().min(1).max(1000),
  option_c: z.string().trim().min(1).max(1000), option_d: z.string().trim().min(1).max(1000),
  correct_answer: z.enum(["A", "B", "C", "D"]), explanation: z.string().trim().max(5000).optional().default("")
});
export const searchSchema = z.object({
  q: z.string().trim().min(2).max(500),
  mode: z.enum(["semantic", "keyword", "hybrid"]).default("hybrid"),
  limit: z.coerce.number().int().min(1).max(30).default(10)
});

