export function normalizeQuestion(value) { return String(value || "").trim().toLowerCase().replace(/\s+/g, " "); }

export function validateQuizzes(items, limit = 30) {
  const seen = new Set();
  const output = [];
  for (const item of Array.isArray(items) ? items : []) {
    const question = String(item?.question || "").trim();
    const normalized = normalizeQuestion(question);
    const answer = String(item?.correct_answer || "").trim().toUpperCase();
    const options = ["a", "b", "c", "d"].map((key) => String(item?.[`option_${key}`] || "").trim());
    if (!question || seen.has(normalized) || options.some((option) => !option) || !["A", "B", "C", "D"].includes(answer)) continue;
    seen.add(normalized);
    output.push({ question, option_a: options[0], option_b: options[1], option_c: options[2], option_d: options[3], correct_answer: answer, explanation: String(item.explanation || "").trim() });
    if (output.length >= limit) break;
  }
  return output;
}
