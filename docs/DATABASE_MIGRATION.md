# Database Migration

1. Backup database Supabase.
2. Mở SQL Editor và chạy `database/migrations/002_rag_versions_security.sql` một lần.
3. Xác nhận extension `vector`, bảng `document_chunks`, `ai_generations`, hai RPC và bucket private `study-documents`.
4. Restart backend với biến môi trường mới.
5. Reindex tài liệu cần semantic search.
6. Tùy chọn chạy `npm run migrate:storage` trong `backend` để chuyển upload local cũ.

Migration dùng `if not exists`/guard cho schema và backfill generation legacy, nên có thể chạy trên database có dữ liệu. Không xóa cột `file_path`; cột này được giữ để tương thích file cũ.
