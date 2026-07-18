# API Changes

- `POST /api/documents/:id/reindex`: lập chỉ mục lại tài liệu thuộc user.
- `GET /api/documents/:id/download-url`: signed URL 5 phút cho file gốc.
- `GET /api/search?q=&mode=hybrid&limit=10`: keyword, semantic hoặc hybrid.
- `POST /api/ai/quizzes/:documentId` với `{ "question_count": 10 }`.
- `POST /api/ai/quiz-attempts/:documentId` với `generation_id` và map `answers`.
- `GET /api/documents/:documentId/ai-generations`.
- `GET /api/ai-generations/:generationId`.
- `PATCH /api/ai-generations/:generationId/activate`.
- `DELETE /api/ai-generations/:generationId`.
- `PATCH /api/summaries/:id`, `/api/flashcards/:id`, `/api/quizzes/:id`.
- `POST /api/auth/logout`: tăng `token_version`, vô hiệu token cũ.

Các route cũ tạo AI vẫn được giữ. `GET /api/documents/:id` chỉ trả nội dung của version active và không trả `correct_answer`/`explanation` trước khi nộp quiz.

