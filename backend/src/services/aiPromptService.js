export function buildSummaryPrompt(documentText) {
  return `Bạn là trợ lý học tập. Hãy tóm tắt bằng tiếng Việt, chỉ dùng nội dung được cung cấp. Gồm tóm tắt ngắn, các ý chính và khái niệm cần nhớ.\n\nNội dung:\n${documentText}`;
}

export function buildFlashcardPrompt(documentText, count = 10) {
  return `Tạo đúng ${count} flashcard từ tài liệu, không dùng kiến thức ngoài. Trả duy nhất JSON [{"question":"...","answer":"..."}], không trùng câu hỏi.\n\nNội dung:\n${documentText}`;
}

export function buildQuizPrompt(documentText, questionCount = 5, existingQuestions = []) {
  const excluded = existingQuestions.length ? `\nKhông lặp lại các câu đã có:\n${existingQuestions.map((item) => `- ${item}`).join("\n")}` : "";
  return `Tạo đúng ${questionCount} câu trắc nghiệm từ tài liệu. Mỗi câu có question, option_a, option_b, option_c, option_d, đúng một correct_answer thuộc A/B/C/D và explanation. Không trùng câu hỏi. Trả duy nhất JSON hợp lệ.${excluded}\nMOCK_OFFSET=${existingQuestions.length}\n\nNội dung:\n${documentText}`;
}

export function buildRagPrompt(question, sources) {
  const context = sources.map((source, index) => `[Nguồn ${index + 1}]\n${source.content}`).join("\n\n");
  return `Bạn là trợ lý học tập. Chỉ trả lời bằng tiếng Việt dựa trên các nguồn bên dưới, không thêm kiến thức ngoài. Nếu không có câu trả lời, ghi chính xác: "Không tìm thấy thông tin này trong tài liệu." Không tự tạo nguồn. Trả JSON {"answer":"...","used_source_numbers":[1]}.\n\nCâu hỏi: ${question}\n\n${context}`;
}

export function buildSynthesisPrompt(partialSummaries) {
  return `Tổng hợp các bản tóm tắt sau thành một bản tiếng Việt mạch lạc gồm tóm tắt ngắn, ý chính và khái niệm cần nhớ. Không thêm kiến thức ngoài.\n\n${partialSummaries.join("\n\n")}`;
}
