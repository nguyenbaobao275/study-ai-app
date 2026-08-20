import { supabase } from "../config/supabase.js";
import { generateContent } from "./geminiService.js";
import { buildStudyPlanPrompt } from "./aiPromptService.js";

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function isValidStudyPlan(content) {
  const value = String(content || "").trim();
  return value.length >= 120 && Array.from({ length: 7 }, (_, index) => index + 1)
    .every((day) => new RegExp(`Ngày\\s+${day}(?:\\D|$)`, "i").test(value));
}

async function loadStudyContext(userId) {
  const [subjectsResult, tasksResult, documentsResult, attemptsResult] = await Promise.all([
    supabase.from("subjects").select("id, name, description").eq("user_id", userId).order("created_at", { ascending: true }).limit(20),
    supabase.from("tasks").select("id, title, due_date, status, subjects(name)").eq("user_id", userId).neq("status", "completed").order("due_date", { ascending: true }).limit(30),
    supabase.from("documents").select("id, title, index_status, subjects(name)").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("quiz_attempts").select("score").eq("user_id", userId).order("created_at", { ascending: false }).limit(20)
  ]);

  for (const result of [subjectsResult, tasksResult, documentsResult, attemptsResult]) {
    if (result.error) throw result.error;
  }

  const scores = (attemptsResult.data || []).map((attempt) => Number(attempt.score)).filter(Number.isFinite);
  const quizSummary = scores.length
    ? `${scores.length} lượt gần nhất, điểm trung bình ${Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)}%.`
    : "Chưa có lượt làm quiz.";

  return {
    subjects: subjectsResult.data || [],
    tasks: tasksResult.data || [],
    documents: documentsResult.data || [],
    quizSummary
  };
}

export async function generateStudyPlan(userId) {
  const context = await loadStudyContext(userId);
  if (!context.subjects.length && !context.tasks.length && !context.documents.length) {
    const error = new Error("Hãy tạo môn học, nhiệm vụ hoặc tài liệu trước khi lập kế hoạch.");
    error.statusCode = 400;
    throw error;
  }
  const content = await generateContent(buildStudyPlanPrompt({ ...context, startDate: isoDate(new Date()) }));
  if (!isValidStudyPlan(content)) throw new Error("AI không trả về kế hoạch học tập đủ 7 ngày.");

  const { data, error } = await supabase.from("study_plans")
    .insert({ user_id: userId, content: content.trim() })
    .select("*")
    .single();
  if (error) throw error;
  return { ...data, persisted: true };
}
