import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function normalizeQuery(query) {
  return String(query || "").trim();
}

export const searchStudyData = asyncHandler(async (req, res) => {
  const q = normalizeQuery(req.query.q);

  if (q.length < 2) {
    return res.json({ documents: [], summaries: [], flashcards: [], quizzes: [] });
  }

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id, title, file_name, file_type, extracted_text, subjects(name), created_at")
    .eq("user_id", req.user.id)
    .or(`title.ilike.%${q}%,file_name.ilike.%${q}%,extracted_text.ilike.%${q}%`)
    .limit(10);

  if (documentsError) throw documentsError;

  const { data: ownedDocuments, error: ownedError } = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", req.user.id);

  if (ownedError) throw ownedError;

  const documentIds = ownedDocuments?.map((doc) => doc.id) || [];
  if (!documentIds.length) {
    return res.json({ documents: documents || [], summaries: [], flashcards: [], quizzes: [] });
  }

  const [summariesResult, flashcardsResult, quizzesResult] = await Promise.all([
    supabase
      .from("summaries")
      .select("id, document_id, content, created_at")
      .in("document_id", documentIds)
      .ilike("content", `%${q}%`)
      .limit(10),
    supabase
      .from("flashcards")
      .select("id, document_id, question, answer, created_at")
      .in("document_id", documentIds)
      .or(`question.ilike.%${q}%,answer.ilike.%${q}%`)
      .limit(10),
    supabase
      .from("quizzes")
      .select("id, document_id, question, explanation, created_at")
      .in("document_id", documentIds)
      .or(`question.ilike.%${q}%,explanation.ilike.%${q}%`)
      .limit(10)
  ]);

  if (summariesResult.error) throw summariesResult.error;
  if (flashcardsResult.error) throw flashcardsResult.error;
  if (quizzesResult.error) throw quizzesResult.error;

  res.json({
    documents: documents || [],
    summaries: summariesResult.data || [],
    flashcards: flashcardsResult.data || [],
    quizzes: quizzesResult.data || []
  });
});
