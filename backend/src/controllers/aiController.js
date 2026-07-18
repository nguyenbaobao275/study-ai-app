import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertFound, getOwnedDocument, getOwnedGeneration } from "../services/ownershipService.js";
import { generateFlashcardVersion, generateQuizVersion, generateSummaryVersion } from "../services/aiGenerationService.js";
import { answerDocumentQuestion } from "../services/ragService.js";

async function ownedDocument(req) {
  return assertFound(await getOwnedDocument(req.params.documentId, req.user.id), "Không tìm thấy tài liệu.");
}

export const summarizeDocument = asyncHandler(async (req, res) => {
  res.status(201).json(await generateSummaryVersion(await ownedDocument(req)));
});

export const generateFlashcards = asyncHandler(async (req, res) => {
  res.status(201).json(await generateFlashcardVersion(await ownedDocument(req), 10));
});

export const generateQuizzes = asyncHandler(async (req, res) => {
  res.status(201).json(await generateQuizVersion(await ownedDocument(req), req.body.question_count));
});

export const askDocument = asyncHandler(async (req, res) => {
  const document = await ownedDocument(req);
  res.status(201).json(await answerDocumentQuestion({ document, userId: req.user.id, question: req.body.question }));
});

export const submitQuizAttempt = asyncHandler(async (req, res) => {
  const document = await ownedDocument(req);
  const generation = assertFound(await getOwnedGeneration(req.body.generation_id, req.user.id), "Không tìm thấy phiên bản quiz.");
  if (generation.document_id !== document.id || generation.content_type !== "quiz" || generation.status !== "completed") {
    return res.status(400).json({ message: "Phiên bản quiz không thuộc tài liệu này hoặc chưa hoàn tất." });
  }
  const { data: quizzes, error: quizError } = await supabase.from("quizzes")
    .select("id, correct_answer, explanation").eq("document_id", document.id).eq("generation_id", generation.id);
  if (quizError) throw quizError;
  const quizIds = new Set((quizzes || []).map((quiz) => quiz.id));
  if (Object.keys(req.body.answers).some((id) => !quizIds.has(id))) return res.status(400).json({ message: "Có câu trả lời không thuộc bộ quiz này." });
  const results = (quizzes || []).map((quiz) => {
    const selected = req.body.answers[quiz.id] || null;
    return { quiz_id: quiz.id, selected_answer: selected, correct_answer: quiz.correct_answer, is_correct: selected === quiz.correct_answer, explanation: quiz.explanation || "" };
  });
  const total = results.length;
  const correct = results.filter((result) => result.is_correct).length;
  const score = total ? Math.round((correct / total) * 10000) / 100 : 0;
  const { data: attempt, error } = await supabase.from("quiz_attempts").insert({
    user_id: req.user.id, document_id: document.id, generation_id: generation.id,
    total_questions: total, correct_count: correct, score, answers: req.body.answers
  }).select("*").single();
  if (error) throw error;
  res.status(201).json({ attempt, results });
});
