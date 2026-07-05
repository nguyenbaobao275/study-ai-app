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
  let attemptsCount = 0;
  let averageScore = 0;

  if (documentIds.length > 0) {
    const [summaryResult, flashcardResult, quizResult, attemptsResult] = await Promise.all([
      supabase.from("summaries").select("*", { count: "exact", head: true }).in("document_id", documentIds),
      supabase.from("flashcards").select("*", { count: "exact", head: true }).in("document_id", documentIds),
      supabase.from("quizzes").select("*", { count: "exact", head: true }).in("document_id", documentIds),
      supabase
        .from("quiz_attempts")
        .select("score", { count: "exact" })
        .eq("user_id", userId)
        .in("document_id", documentIds)
    ]);

    summariesCount = summaryResult.count || 0;
    flashcardsCount = flashcardResult.count || 0;
    quizzesCount = quizResult.count || 0;
    attemptsCount = attemptsResult.count || 0;
    const scores = attemptsResult.data?.map((attempt) => Number(attempt.score)).filter(Number.isFinite) || [];
    averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
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

  const { data: latestStudyPlan, error: studyPlanError } = await supabase
    .from("study_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (studyPlanError && !studyPlanError.message?.includes("schema cache") && studyPlanError.code !== "PGRST205") {
    throw studyPlanError;
  }

  const { data: subjectProgress } = await supabase
    .from("subjects")
    .select("id, name, tasks(id, status), documents(id)")
    .eq("user_id", userId)
    .limit(8);

  res.json({
    subjectsCount,
    tasksCount,
    completedTasks: completedTasks || 0,
    documentsCount,
    summariesCount,
    flashcardsCount,
    quizzesCount,
    attemptsCount,
    averageScore,
    upcomingTasks: upcomingTasks || [],
    recentDocuments: recentDocuments || [],
    latestStudyPlan: latestStudyPlan || null,
    subjectProgress: (subjectProgress || []).map((subject) => {
      const tasks = subject.tasks || [];
      const completed = tasks.filter((task) => task.status === "completed").length;
      return {
        id: subject.id,
        name: subject.name,
        tasksCount: tasks.length,
        completedTasks: completed,
        documentsCount: subject.documents?.length || 0
      };
    })
  });
});
