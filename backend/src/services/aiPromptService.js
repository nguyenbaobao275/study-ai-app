export function buildSummaryPrompt(documentText) {
  return `Bạn là trợ lý học tập cho sinh viên công nghệ thông tin.

Hãy tóm tắt nội dung tài liệu dưới đây theo 3 phần:
1. Tóm tắt ngắn trong 5-7 dòng.
2. Các ý chính dạng gạch đầu dòng.
3. Các khái niệm quan trọng cần ghi nhớ.

Yêu cầu:
- Viết bằng tiếng Việt.
- Ngắn gọn, dễ hiểu.
- Không thêm thông tin ngoài tài liệu.

Nội dung tài liệu:
${documentText}`;
}

export function buildFlashcardPrompt(documentText) {
  return `Bạn là trợ lý học tập.

Từ nội dung sau, hãy tạo 10 flashcard để sinh viên ôn tập.

Mỗi flashcard gồm:
- question: câu hỏi ngắn gọn
- answer: câu trả lời dễ hiểu

Chỉ trả về JSON hợp lệ theo dạng:
[
  {
    "question": "...",
    "answer": "..."
  }
]

Không thêm markdown, không thêm giải thích bên ngoài JSON.

Nội dung:
${documentText}`;
}

export function buildQuizPrompt(documentText) {
  return `Bạn là trợ lý tạo câu hỏi ôn tập cho sinh viên.

Dựa trên nội dung sau, hãy tạo 5 câu hỏi trắc nghiệm.

Mỗi câu hỏi gồm:
- question
- option_a
- option_b
- option_c
- option_d
- correct_answer: chỉ trả A, B, C hoặc D
- explanation

Chỉ trả về JSON hợp lệ theo dạng:
[
  {
    "question": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A",
    "explanation": "..."
  }
]

Không thêm markdown, không thêm giải thích bên ngoài JSON.

Nội dung:
${documentText}`;
}

export function buildDocumentChatPrompt(documentText, question) {
  return `Bạn là trợ lý học tập trả lời câu hỏi dựa trên tài liệu của sinh viên.

Yêu cầu:
- Trả lời bằng tiếng Việt.
- Chỉ dùng thông tin có trong tài liệu; nếu tài liệu không đủ dữ kiện, hãy nói rõ.
- Trả lời ngắn gọn, có gạch đầu dòng khi phù hợp.

Câu hỏi của sinh viên:
${question}

Nội dung tài liệu:
${documentText}`;
}

export function buildStudyPlanPrompt({ tasks, documents, subjects }) {
  return `Bạn là trợ lý lập kế hoạch học tập cá nhân.

Dựa trên dữ liệu dưới đây, hãy đề xuất kế hoạch học trong 7 ngày tới.

Yêu cầu:
- Viết bằng tiếng Việt.
- Ưu tiên deadline gần, nhiệm vụ chưa hoàn thành và tài liệu mới.
- Chia theo từng ngày, mỗi ngày có 2-4 việc cụ thể.
- Cuối cùng thêm 3 lời khuyên ôn tập ngắn.

Môn học:
${JSON.stringify(subjects, null, 2)}

Nhiệm vụ:
${JSON.stringify(tasks, null, 2)}

Tài liệu:
${JSON.stringify(documents, null, 2)}`;
}
