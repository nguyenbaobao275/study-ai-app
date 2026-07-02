import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateContent, parseJsonFromAI } from "../services/geminiService.js";
import { buildSummaryPrompt, buildFlashcardPrompt, buildQuizPrompt } from "../services/aiPromptService.js";

async function getOwnedDocument(documentId, userId) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data;
}

function limitText(text, maxChars = 16000) {
  if (!text) return "";
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

export const summarizeDocument = asyncHandler(async (req, res) => {
  const document = await getOwnedDocument(req.params.documentId, req.user.id);

  if (!document) {
    return res.status(404).json({ message: "Không tìm thấy tài liệu" });
  }

  const documentText = limitText(document.extracted_text);
  const prompt = buildSummaryPrompt(documentText);
  const content = await generateContent(prompt);

  const { data, error } = await supabase
    .from("summaries")
    .insert({
      document_id: document.id,
      summary_type: "ai_summary",
      content
    })
    .select("*")
    .single();

  if (error) throw error;
  res.status(201).json(data);
});

export const generateFlashcards = asyncHandler(async (req, res) => {
  const document = await getOwnedDocument(req.params.documentId, req.user.id);

  if (!document) {
    return res.status(404).json({ message: "Không tìm thấy tài liệu" });
  }

  const prompt = buildFlashcardPrompt(limitText(document.extracted_text));
  const aiText = await generateContent(prompt);
  const flashcards = parseJsonFromAI(aiText, []);

  if (!Array.isArray(flashcards) || flashcards.length === 0) {
    return res.status(500).json({ message: "AI không trả về flashcard hợp lệ" });
  }

  const rows = flashcards
    .filter((item) => item.question && item.answer)
    .map((item) => ({
      document_id: document.id,
      question: item.question,
      answer: item.answer
    }));

  const { data, error } = await supabase
    .from("flashcards")
    .insert(rows)
    .select("*");

  if (error) throw error;
  res.status(201).json(data);
});

export const generateQuizzes = asyncHandler(async (req, res) => {
  const document = await getOwnedDocument(req.params.documentId, req.user.id);

  if (!document) {
    return res.status(404).json({ message: "Không tìm thấy tài liệu" });
  }

  const prompt = buildQuizPrompt(limitText(document.extracted_text));
  const aiText = await generateContent(prompt);
  const quizzes = parseJsonFromAI(aiText, []);

  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    return res.status(500).json({ message: "AI không trả về câu hỏi hợp lệ" });
  }

  const rows = quizzes
    .filter((item) => item.question && item.option_a && item.correct_answer)
    .map((item) => ({
      document_id: document.id,
      question: item.question,
      option_a: item.option_a,
      option_b: item.option_b,
      option_c: item.option_c,
      option_d: item.option_d,
      correct_answer: String(item.correct_answer).trim().toUpperCase(),
      explanation: item.explanation || ""
    }));

  const { data, error } = await supabase
    .from("quizzes")
    .insert(rows)
    .select("*");

  if (error) throw error;
  res.status(201).json(data);
});
