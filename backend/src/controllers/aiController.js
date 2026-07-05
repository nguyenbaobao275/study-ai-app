import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateContent, parseJsonFromAI } from "../services/geminiService.js";
import {
  buildDocumentChatPrompt,
  buildFlashcardPrompt,
  buildQuizPrompt,
  buildStudyPlanPrompt,
  buildSummaryPrompt
} from "../services/aiPromptService.js";

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

function isSchemaCacheMiss(error) {
  return error?.code === "PGRST205" || error?.message?.includes("schema cache");
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

export const submitQuizAttempt = asyncHandler(async (req, res) => {
  const document = await getOwnedDocument(req.params.documentId, req.user.id);
  if (!document) {
    return res.status(404).json({ message: "Không tìm thấy tài liệu" });
  }

  const answers = req.body.answers || {};
  const { data: quizzes, error: quizError } = await supabase
    .from("quizzes")
    .select("id, correct_answer")
    .eq("document_id", document.id);

  if (quizError) throw quizError;

  const total = quizzes?.length || 0;
  const correct = (quizzes || []).filter((quiz) => answers[quiz.id] === quiz.correct_answer).length;
  const score = total ? Math.round((correct / total) * 10000) / 100 : 0;

  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: req.user.id,
      document_id: document.id,
      total_questions: total,
      correct_count: correct,
      score,
      answers
    })
    .select("*")
    .single();

  if (error) {
    if (!isSchemaCacheMiss(error)) throw error;

    return res.status(201).json({
      id: `preview-${Date.now()}`,
      user_id: req.user.id,
      document_id: document.id,
      total_questions: total,
      correct_count: correct,
      score,
      answers,
      created_at: new Date().toISOString(),
      persisted: false
    });
  }

  res.status(201).json({ ...data, persisted: true });
});

export const askDocument = asyncHandler(async (req, res) => {
  const document = await getOwnedDocument(req.params.documentId, req.user.id);
  if (!document) {
    return res.status(404).json({ message: "Không tìm thấy tài liệu" });
  }

  const question = String(req.body.question || "").trim();
  if (!question) {
    return res.status(400).json({ message: "Vui lòng nhập câu hỏi" });
  }

  const prompt = buildDocumentChatPrompt(limitText(document.extracted_text), question);
  const answer = await generateContent(prompt);

  const { data, error } = await supabase
    .from("document_chats")
    .insert({
      user_id: req.user.id,
      document_id: document.id,
      question,
      answer
    })
    .select("*")
    .single();

  if (error) {
    if (!isSchemaCacheMiss(error)) throw error;

    return res.status(201).json({
      id: `preview-${Date.now()}`,
      user_id: req.user.id,
      document_id: document.id,
      question,
      answer,
      created_at: new Date().toISOString(),
      persisted: false
    });
  }

  res.status(201).json({ ...data, persisted: true });
});

export const generateStudyPlan = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [tasksResult, documentsResult, subjectsResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("title, description, due_date, status, subjects(name)")
      .eq("user_id", userId)
      .order("due_date", { ascending: true })
      .limit(12),
    supabase
      .from("documents")
      .select("title, file_type, created_at, subjects(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("subjects").select("name, description").eq("user_id", userId).limit(20)
  ]);

  if (tasksResult.error) throw tasksResult.error;
  if (documentsResult.error) throw documentsResult.error;
  if (subjectsResult.error) throw subjectsResult.error;

  const prompt = buildStudyPlanPrompt({
    tasks: tasksResult.data || [],
    documents: documentsResult.data || [],
    subjects: subjectsResult.data || []
  });
  const content = await generateContent(prompt);

  const { data, error } = await supabase
    .from("study_plans")
    .insert({ user_id: userId, content })
    .select("*")
    .single();

  if (error) {
    if (!isSchemaCacheMiss(error)) throw error;

    return res.status(201).json({
      id: "preview",
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
      persisted: false
    });
  }

  res.status(201).json({ ...data, persisted: true });
});
