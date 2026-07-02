# StudyAI - Ứng dụng quản lý học tập cá nhân tích hợp AI

Đề tài: **Xây dựng ứng dụng quản lý học tập cá nhân tích hợp AI hỗ trợ tóm tắt tài liệu và tạo câu hỏi ôn tập**.

Project gồm:

- `client/`: giao diện React + Vite.
- `server/`: backend Node.js + Express.
- `database/schema.sql`: cấu trúc database Supabase PostgreSQL.

## Chức năng đã dựng sẵn

- Đăng ký, đăng nhập bằng JWT.
- Quản lý môn học.
- Quản lý nhiệm vụ/deadline.
- Upload tài liệu `.txt`.
- Đọc nội dung file `.txt` và lưu vào database.
- Tóm tắt tài liệu bằng AI.
- Tạo flashcard bằng AI.
- Tạo câu hỏi trắc nghiệm bằng AI.
- Dashboard thống kê.
- Có chế độ mock AI để demo khi chưa có API key.

## 1. Tạo database Supabase

Vào Supabase tạo project mới, mở SQL Editor và chạy file:

```bash
database/schema.sql
```

Sau đó lấy:

- Project URL.
- Service Role Key.

> Lưu ý: Service Role Key chỉ được để trong backend `.env`, không đưa vào frontend.

## 2. Chạy backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Cập nhật file `.env`:

```env
PORT=5000
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
GEMINI_USE_MOCK=false
```

Nếu chưa có Gemini API key, để:

```env
GEMINI_USE_MOCK=true
```

Khi đó hệ thống vẫn tạo tóm tắt/flashcard/quiz mẫu để demo.

## 3. Chạy frontend

Mở terminal khác:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

File `.env` frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

## 4. Kịch bản demo đề xuất

1. Đăng ký tài khoản.
2. Tạo môn học: Công nghệ phần mềm.
3. Tạo nhiệm vụ: Nộp báo cáo chương 1.
4. Upload file `.txt` chứa nội dung bài học.
5. Bấm tóm tắt bằng AI.
6. Bấm tạo flashcard.
7. Bấm tạo câu hỏi ôn tập.
8. Xem dashboard thống kê.

## 5. Gợi ý phát triển tiếp

- Hỗ trợ upload PDF/DOCX.
- Thêm chatbot hỏi đáp theo tài liệu.
- Thêm lịch học dạng calendar.
- Thêm xuất tóm tắt ra PDF.
- Thêm phân quyền admin.
- Làm đẹp giao diện bằng Tailwind CSS hoặc shadcn/ui.
