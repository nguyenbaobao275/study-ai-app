# StudyAI

StudyAI là trợ lý học tập full-stack dùng React, Express, Supabase PostgreSQL và Gemini. Ứng dụng quản lý môn học, nhiệm vụ, tài liệu, tóm tắt, flashcard, quiz và hỏi đáp có trích nguồn.

## Kiến trúc

```text
React/Vite -> Express API -> Supabase PostgreSQL + private Storage
                         -> Gemini generation + embedding

Upload -> extract -> chunk -> embedding -> pgvector
Question -> query embedding -> match_document_chunks -> Gemini -> citation
```

Backend giữ service role key; frontend chỉ giữ JWT của StudyAI. File mới nằm trong private bucket `study-documents`, đường dẫn `{userId}/{documentId}/{safeFileName}`.

## Cài đặt

1. Chạy `database/schema.sql` cho database mới, hoặc `database/migrations/002_rag_versions_security.sql` cho database hiện có.
2. Tạo/cập nhật `backend/.env` từ `backend/.env.example`. `SUPABASE_URL` phải là URL gốc dạng `https://project.supabase.co`, không có `/rest/v1`.
3. Đảm bảo bucket `study-documents` là private. Migration sẽ tạo bucket nếu tài khoản chạy SQL có quyền.
4. Chạy backend bằng `cd backend && npm install && npm run dev`.
5. Chạy frontend bằng `cd frontend && npm install && npm run dev`.

Không commit `.env`. Nếu secret từng xuất hiện trong git hoặc file chia sẻ, hãy rotate Supabase service key, Gemini API key và JWT secret.

## Biến môi trường

Các biến mới gồm `ALLOWED_ORIGINS`, `MAX_EXTRACTED_TEXT_CHARS`, `JWT_EXPIRES_IN`, `SUPABASE_STORAGE_BUCKET`, `GEMINI_EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`, `RAG_MATCH_COUNT`, `RAG_MATCH_THRESHOLD` và `PDF_FONT_PATH`. Xem đầy đủ trong `backend/.env.example`.

`PDF_FONT_PATH` có thể trỏ đến font Unicode trên máy chạy server. Nếu để trống hoặc file không tồn tại, PDFKit dùng font mặc định và server vẫn chạy.

## RAG và tìm kiếm

Upload mới tạo chunk khoảng 800-1.200 ký tự với overlap, embedding 768 chiều và trạng thái `pending/processing/completed/failed`. Khi lỗi, trang chi tiết có nút **Lập chỉ mục lại**.

Tìm kiếm hỗ trợ `hybrid`, `semantic`, `keyword` qua `GET /api/search?q=...&mode=hybrid&limit=10`. Nếu embedding lỗi, hybrid/semantic tự chuyển sang keyword và trả `search_mode_used=keyword_fallback`.

Mock mode (`GEMINI_USE_MOCK=true`) dùng embedding hashing ổn định, phù hợp demo và unit test. Mock không thay thế chất lượng semantic của model thật.

## AI version và quiz

Mỗi lần tạo summary, flashcard hoặc quiz tạo một `ai_generations` mới. Chỉ version hoàn tất mới được activate; RPC `activate_ai_generation` đảm bảo mỗi loại chỉ có một version active. Trang chi tiết hỗ trợ xem, sửa, activate và xóa version.

Quiz cho chọn 1-30 câu (UI có lựa chọn nhanh 5/10/15/20). API chi tiết không trả đáp án; backend chấm điểm sau khi gọi endpoint submit.

## Chuyển file local cũ

Sau khi migration và bucket đã sẵn sàng:

```bash
cd backend
npm run migrate:storage
```

Script chỉ xử lý row có `file_path` nhưng chưa có `storage_path`, có thể chạy lại và không xóa file local.

## Kiểm thử

```bash
cd backend
npm test

cd ../frontend
npm run build
```

## Giới hạn

- PDF scan chưa có OCR; PDF phải có text có thể trích xuất.
- `page_number` có thể là `null` vì thư viện hiện tại không luôn ánh xạ được trang.
- Semantic search phụ thuộc embedding model và migration pgvector.
- Indexing chạy trực tiếp trong request, chưa có background queue.
- File local cũ cần chạy script migration trước khi dùng signed download URL.
