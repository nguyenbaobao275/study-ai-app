# StudyAI - Ứng dụng quản lý học tập cá nhân tích hợp AI

Đề tài: **Xây dựng ứng dụng quản lý học tập cá nhân tích hợp AI hỗ trợ tóm tắt tài liệu, tạo flashcard, tạo quiz và lập kế hoạch học tập**.

Project được chia rõ thành **Frontend**, **Backend** và **Database**.

## 1. Cấu Trúc Dự Án

```txt
study-ai-app/
├── frontend/               # Frontend - React + Vite
│   ├── src/
│   │   ├── components/     # Component dùng lại
│   │   ├── context/        # AuthContext, trạng thái đăng nhập
│   │   ├── pages/          # Các màn hình chính
│   │   ├── services/       # Cấu hình gọi API bằng axios
│   │   ├── styles/         # CSS toàn cục
│   │   ├── App.jsx         # Khai báo route frontend
│   │   └── main.jsx        # Entry point React
│   ├── .env                # Biến môi trường frontend
│   └── package.json
│
├── backend/                # Backend - Node.js + Express
│   ├── src/
│   │   ├── config/         # Kết nối Supabase
│   │   ├── controllers/    # Xử lý nghiệp vụ API
│   │   ├── middleware/     # Auth middleware, error handler
│   │   ├── routes/         # Khai báo API routes
│   │   ├── services/       # AI service, trích xuất tài liệu
│   │   ├── utils/          # Helper dùng chung
│   │   └── index.js        # Entry point backend
│   ├── scripts/            # Script tạo dữ liệu mẫu
│   ├── uploads/            # File upload local
│   ├── .env                # Biến môi trường backend
│   └── package.json
│
├── database/
│   └── schema.sql          # Schema Supabase PostgreSQL
│
├── sample-data/            # Tài liệu mẫu để demo
└── README.md
```

## 2. Frontend

Thư mục: `frontend/`

Công nghệ:

- React
- Vite
- React Router
- Axios
- CSS thuần

Chức năng chính:

- Đăng ký, đăng nhập.
- Dashboard thống kê học tập.
- Quản lý môn học.
- Quản lý nhiệm vụ/deadline.
- Lịch học dạng calendar.
- Quản lý tài liệu.
- Xem chi tiết tài liệu.
- Chat hỏi đáp theo tài liệu.
- Làm quiz và lưu kết quả.
- Tìm kiếm học liệu.
- Trang admin nếu tài khoản có quyền admin.

Chạy frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định chạy tại:

```txt
http://localhost:5173
```

File môi trường frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

## 3. Backend

Thư mục: `backend/`

Công nghệ:

- Node.js
- Express
- JWT Authentication
- Supabase PostgreSQL
- Gemini API
- Multer upload file
- pdf-parse, mammoth để đọc PDF/DOCX
- pdfkit để xuất PDF

Nhóm API chính:

```txt
/api/auth        # Đăng ký, đăng nhập, lấy thông tin user
/api/subjects    # Quản lý môn học
/api/tasks       # Quản lý nhiệm vụ/deadline
/api/documents   # Upload, xem, xóa, xuất PDF tài liệu
/api/ai          # Tóm tắt, flashcard, quiz, chat, kế hoạch học tập
/api/dashboard   # Thống kê học tập
/api/search      # Tìm kiếm học liệu
/api/admin       # Thống kê admin
```

Chạy backend:

```bash
cd backend
npm install
npm run dev
```

Backend mặc định chạy tại:

```txt
http://localhost:5000
```

File môi trường backend:

```env
PORT=5000
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_USE_MOCK=false
```

Nếu chưa có Gemini API key, có thể bật mock:

```env
GEMINI_USE_MOCK=true
```

## 4. Database

Thư mục: `database/`

File schema:

```txt
database/schema.sql
```

Các nhóm bảng chính:

- `users`: tài khoản người dùng.
- `subjects`: môn học.
- `tasks`: nhiệm vụ/deadline.
- `documents`: tài liệu upload.
- `summaries`: bản tóm tắt AI.
- `flashcards`: flashcard AI.
- `quizzes`: câu hỏi trắc nghiệm AI.
- `quiz_attempts`: lịch sử làm quiz.
- `document_chats`: lịch sử hỏi đáp theo tài liệu.
- `study_plans`: kế hoạch học tập AI.

Cách tạo database:

1. Tạo project trên Supabase.
2. Mở SQL Editor.
3. Chạy toàn bộ nội dung file `database/schema.sql`.

Nếu cần reload schema cache Supabase:

```sql
notify pgrst, 'reload schema';
```

## 5. Tài Khoản Demo

Tạo dữ liệu mẫu:

```bash
cd backend
npm run seed:example
```

Tài khoản demo:

```txt
Email: demo@studyai.local
Password: Demo123456
```

## 6. Cách Chạy Toàn Bộ Chương Trình

Mở 2 terminal.

Terminal 1 - Backend:

```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:

```bash
cd frontend
npm run dev
```

Sau đó mở trình duyệt:

```txt
http://localhost:5173
```

## 7. Kịch Bản Demo

1. Đăng nhập bằng tài khoản demo.
2. Xem Dashboard tổng quan.
3. Tạo môn học mới.
4. Tạo nhiệm vụ/deadline.
5. Xem deadline trong Lịch học.
6. Upload tài liệu `.txt`, `.md`, `.pdf` hoặc `.docx`.
7. Mở chi tiết tài liệu.
8. Tạo tóm tắt AI.
9. Tạo flashcard và bấm để lật thẻ xem đáp án.
10. Tạo quiz, làm quiz và lưu kết quả.
11. Chat hỏi đáp theo tài liệu.
12. Xuất tóm tắt ra PDF.
13. Tạo kế hoạch học tập AI trên Dashboard.
14. Tìm kiếm nội dung trong tài liệu, summary, flashcard và quiz.

## 8. Ghi Chú

- Service Role Key của Supabase chỉ đặt trong `backend/.env`, không đưa vào frontend.
- Nếu đổi file `.env`, cần restart lại backend/frontend.
- Nếu trình duyệt lưu token cũ, đăng xuất hoặc xóa `study_ai_token` trong Local Storage rồi đăng nhập lại.
