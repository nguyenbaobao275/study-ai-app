# RAG Architecture

## Indexing

```text
Multer memory buffer
-> magic-byte validation
-> text extraction (TXT/MD/PDF/DOCX)
-> private Supabase Storage
-> documents(index_status=processing)
-> paragraph/sentence-aware chunks
-> Gemini or deterministic mock embeddings (768)
-> document_chunks
-> documents(index_status=completed)
```

Nếu embedding hoặc insert lỗi, chunk dở dang bị xóa và document chuyển sang `failed` với thông báo ngắn. `POST /api/documents/:id/reindex` chạy lại toàn bộ quá trình từ `extracted_text`.

## Retrieval

`ragService` kiểm tra ownership và trạng thái index, embedding câu hỏi rồi gọi RPC `match_document_chunks`. RPC luôn lọc `user_id`, có thể lọc thêm `document_id`, tính cosine similarity và giới hạn số chunk.

Gemini chỉ nhận câu hỏi cùng các chunk được đánh số. Backend xác thực `used_source_numbers`, do đó citation không thể trỏ đến nguồn AI tự bịa. Citation chỉ lưu excerpt ngắn, không nhân bản cả chunk.

## Long documents

Summary dài dùng hierarchical summarization. Flashcard và quiz chọn chunk phân bố từ đầu, giữa và cuối thay vì cắt cố định phần đầu.

