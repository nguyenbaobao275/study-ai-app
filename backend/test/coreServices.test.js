import test from "node:test";
import assert from "node:assert/strict";
import { chunkDocument } from "../src/services/documentChunkService.js";
import { generateMockEmbedding } from "../src/services/embeddingService.js";
import { validateQuizzes } from "../src/services/quizService.js";
import { validSourceNumbers } from "../src/services/ragService.js";
import { quizCountSchema } from "../src/schemas/validationSchemas.js";
import { buildQuizPrompt, buildStudyPlanPrompt } from "../src/services/aiPromptService.js";
import { generateContent, parseJsonFromAI } from "../src/services/geminiService.js";
import { isValidStudyPlan } from "../src/services/studyPlanService.js";

function cosine(a, b) {
  let dot = 0; let aa = 0; let bb = 0;
  for (let i = 0; i < a.length; i += 1) { dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  return dot / (Math.sqrt(aa) * Math.sqrt(bb) || 1);
}

test("chunking giữ thứ tự, không tạo chunk rỗng và có overlap", () => {
  const text = Array.from({ length: 80 }, (_, index) => `Câu số ${index} mô tả nội dung học tập quan trọng.`).join(" ");
  const chunks = chunkDocument(text, { targetSize: 500, overlap: 100 });
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.content.trim() && chunk.content.length < 700));
  assert.deepEqual(chunks.map((chunk) => chunk.chunk_index), chunks.map((_, index) => index));
  assert.ok(chunks[1].char_start < chunks[0].char_end);
});

test("mock embedding có 768 chiều và ổn định", () => {
  const first = generateMockEmbedding("cơ sở dữ liệu quan hệ");
  const second = generateMockEmbedding("cơ sở dữ liệu quan hệ");
  assert.equal(first.length, 768); assert.deepEqual(first, second);
  assert.ok(cosine(first, generateMockEmbedding("dữ liệu quan hệ và cơ sở dữ liệu")) > cosine(first, generateMockEmbedding("âm nhạc cổ điển piano")));
});

test("quiz validation loại câu sai và câu trùng", () => {
  const valid = { question: "Khóa chính là gì?", option_a: "A", option_b: "B", option_c: "C", option_d: "D", correct_answer: "A" };
  const result = validateQuizzes([valid, { ...valid, question: "  KHÓA CHÍNH LÀ GÌ? " }, { ...valid, question: "Sai", option_d: "" }]);
  assert.equal(result.length, 1);
});

test("question_count chỉ chấp nhận số nguyên 1 đến 30", () => {
  assert.equal(quizCountSchema.parse({ question_count: 10 }).question_count, 10);
  assert.equal(quizCountSchema.safeParse({ question_count: 0 }).success, false);
  assert.equal(quizCountSchema.safeParse({ question_count: 31 }).success, false);
  assert.equal(quizCountSchema.safeParse({ question_count: 2.5 }).success, false);
});

test("citation parser chỉ giữ source number tồn tại", () => {
  assert.deepEqual(validSourceNumbers([1, 3, 99, -1, 3, "2", "x"], 3), [1, 3, 2]);
});

test("mock quiz tạo đúng số câu bổ sung và không lặp offset", async () => {
  const previous = process.env.GEMINI_USE_MOCK;
  process.env.GEMINI_USE_MOCK = "true";
  try {
    const items = parseJsonFromAI(await generateContent(buildQuizPrompt("Nội dung", 3, ["Câu cũ 1", "Câu cũ 2"])), []);
    assert.equal(items.length, 3);
    assert.match(items[0].question, /số 3/);
  } finally { process.env.GEMINI_USE_MOCK = previous; }
});

test("mock study plan tạo đủ kế hoạch 7 ngày", async () => {
  const previous = process.env.GEMINI_USE_MOCK;
  process.env.GEMINI_USE_MOCK = "true";
  try {
    const prompt = buildStudyPlanPrompt({
      subjects: [{ name: "Cơ sở dữ liệu", description: "Ôn tập SQL" }],
      tasks: [{ title: "Làm bài tập", due_date: "2026-08-25", subjects: { name: "Cơ sở dữ liệu" } }],
      documents: [{ title: "Giáo trình SQL", index_status: "completed", subjects: { name: "Cơ sở dữ liệu" } }],
      quizSummary: "1 lượt, điểm 80%.",
      startDate: "2026-08-20"
    });
    const content = await generateContent(prompt);
    for (let day = 1; day <= 7; day += 1) assert.match(content, new RegExp(`Ngày ${day}`));
    assert.equal(isValidStudyPlan(content), true);
    assert.equal(isValidStudyPlan("Ngày 1: chỉ có một ngày"), false);
  } finally { process.env.GEMINI_USE_MOCK = previous; }
});
