import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function count(table) {
  const { count: total, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) throw error;
  return total || 0;
}

export const getAdminOverview = asyncHandler(async (req, res) => {
  const [usersCount, subjectsCount, tasksCount, documentsCount, attemptsCount] = await Promise.all([
    count("users"),
    count("subjects"),
    count("tasks"),
    count("documents"),
    count("quiz_attempts")
  ]);

  const { data: recentUsers, error: usersError } = await supabase
    .from("users")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  if (usersError) throw usersError;

  const { data: recentDocuments, error: docsError } = await supabase
    .from("documents")
    .select("id, title, file_type, created_at, users(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(8);

  if (docsError) throw docsError;

  res.json({
    usersCount,
    subjectsCount,
    tasksCount,
    documentsCount,
    attemptsCount,
    recentUsers: recentUsers || [],
    recentDocuments: recentDocuments || []
  });
});
