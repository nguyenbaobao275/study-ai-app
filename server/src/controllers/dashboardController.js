import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function countRows(table, userId) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (["subjects", "tasks", "documents"].includes(table)) {
    query = query.eq("user_id", userId);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [subjectsCount, tasksCount, documentsCount] = await Promise.all([
    countRows("subjects", userId),
    countRows("tasks", userId),
    countRows("documents", userId)
  ]);

  const { count: completedTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const { data: documents } = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", userId);

  const documentIds = documents?.map((doc) => doc.id) || [];

  let summariesCount = 0;
  let flashcardsCount = 0;
  let quizzesCount = 0;

  if (documentIds.length > 0) {
    const [summaryResult, flashcardResult, quizResult] = await Promise.all([
      supabase.from("summaries").select("*", { count: "exact", head: true }).in("document_id", documentIds),
      supabase.from("flashcards").select("*", { count: "exact", head: true }).in("document_id", documentIds),
      supabase.from("quizzes").select("*", { count: "exact", head: true }).in("document_id", documentIds)
    ]);

    summariesCount = summaryResult.count || 0;
    flashcardsCount = flashcardResult.count || 0;
    quizzesCount = quizResult.count || 0;
  }

  const { data: upcomingTasks } = await supabase
    .from("tasks")
    .select("*, subjects(name)")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .limit(5);

  const { data: recentDocuments } = await supabase
    .from("documents")
    .select("*, subjects(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  res.json({
    subjectsCount,
    tasksCount,
    completedTasks: completedTasks || 0,
    documentsCount,
    summariesCount,
    flashcardsCount,
    quizzesCount,
    upcomingTasks: upcomingTasks || [],
    recentDocuments: recentDocuments || []
  });
});
