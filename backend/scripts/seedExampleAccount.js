import bcrypt from "bcryptjs";
import { supabase } from "../src/config/supabase.js";

const DEMO_EMAIL = "demo@studyai.local";
const DEMO_PASSWORD = "Demo123456";

const documents = [
  {
    title: "Công nghệ phần mềm căn bản",
    subject: "Công nghệ phần mềm",
    file_name: "cong-nghe-phan-mem-can-ban.txt",
    file_type: "txt",
    extracted_text: `Công nghệ phần mềm là lĩnh vực nghiên cứu cách xây dựng, vận hành và bảo trì phần mềm một cách có hệ thống. Một dự án phần mềm thường đi qua các giai đoạn khảo sát yêu cầu, phân tích, thiết kế, lập trình, kiểm thử, triển khai và bảo trì.

Yêu cầu phần mềm mô tả hệ thống cần làm gì và các ràng buộc khi vận hành. Thiết kế phần mềm chuyển yêu cầu thành cấu trúc thành phần, dữ liệu và giao diện. Kiểm thử giúp phát hiện lỗi, đánh giá chất lượng và xác nhận hệ thống đáp ứng nhu cầu người dùng.

Các mô hình phát triển phổ biến gồm Waterfall, Agile và Scrum. Agile nhấn mạnh phản hồi sớm, chia nhỏ công việc và cải tiến liên tục qua từng vòng lặp.`
  },
  {
    title: "Use case và actor",
    subject: "Công nghệ phần mềm",
    file_name: "use-case-va-actor.md",
    file_type: "md",
    extracted_text: `Use case mô tả tương tác giữa actor và hệ thống để đạt một mục tiêu cụ thể. Actor có thể là người dùng, hệ thống bên ngoài hoặc một vai trò tham gia vào quy trình.

Một use case tốt cần có tên rõ ràng, mục tiêu, tiền điều kiện, luồng chính, luồng thay thế và hậu điều kiện. Use case giúp nhóm phát triển hiểu phạm vi chức năng, giảm hiểu nhầm giữa khách hàng và kỹ sư.

Trong sơ đồ use case, quan hệ include dùng khi một hành vi luôn được tái sử dụng, còn extend dùng cho hành vi mở rộng có điều kiện.`
  },
  {
    title: "Activity diagram",
    subject: "Công nghệ phần mềm",
    file_name: "activity-diagram.pdf",
    file_type: "pdf",
    extracted_text: `Activity diagram mô tả luồng hoạt động trong một quy trình nghiệp vụ hoặc thuật toán. Sơ đồ thường gồm nút bắt đầu, hành động, quyết định, rẽ nhánh, đồng bộ và nút kết thúc.

Activity diagram hữu ích khi phân tích quy trình đăng ký tài khoản, đặt hàng, phê duyệt yêu cầu hoặc xử lý nghiệp vụ nhiều bước. Swimlane có thể được dùng để phân chia trách nhiệm giữa các vai trò.

Khi vẽ activity diagram cần tránh quá nhiều chi tiết kỹ thuật ở mức code. Mục tiêu chính là làm rõ trình tự hoạt động và điều kiện chuyển tiếp.`
  },
  {
    title: "Sequence diagram",
    subject: "Công nghệ phần mềm",
    file_name: "sequence-diagram.docx",
    file_type: "docx",
    extracted_text: `Sequence diagram mô tả sự trao đổi thông điệp giữa các đối tượng theo thời gian. Các thành phần chính gồm actor, object, lifeline, activation bar và message.

Sơ đồ tuần tự giúp hiểu cách các lớp hoặc thành phần phối hợp để thực hiện một chức năng. Ví dụ chức năng đăng nhập có thể gồm người dùng, giao diện, controller, service xác thực và cơ sở dữ liệu.

Message đồng bộ thường yêu cầu phản hồi trước khi tiếp tục, còn message bất đồng bộ cho phép bên gửi tiếp tục xử lý.`
  },
  {
    title: "Cơ sở dữ liệu quan hệ",
    subject: "Cơ sở dữ liệu",
    file_name: "co-so-du-lieu-quan-he.txt",
    file_type: "txt",
    extracted_text: `Cơ sở dữ liệu quan hệ tổ chức dữ liệu thành các bảng. Mỗi bảng gồm các hàng và cột, trong đó mỗi hàng biểu diễn một bản ghi. Khóa chính định danh duy nhất một bản ghi, còn khóa ngoại tạo liên kết giữa các bảng.

Chuẩn hóa dữ liệu giúp giảm trùng lặp và tránh bất thường khi thêm, sửa, xóa dữ liệu. Các dạng chuẩn phổ biến gồm 1NF, 2NF và 3NF.

SQL là ngôn ngữ dùng để truy vấn và thao tác dữ liệu. Các lệnh thường gặp gồm SELECT, INSERT, UPDATE, DELETE, JOIN và GROUP BY.`
  },
  {
    title: "Mạng máy tính cơ bản",
    subject: "Mạng máy tính",
    file_name: "mang-may-tinh-co-ban.md",
    file_type: "md",
    extracted_text: `Mạng máy tính là hệ thống kết nối nhiều thiết bị để chia sẻ dữ liệu và tài nguyên. Các mô hình tham chiếu quan trọng gồm OSI và TCP/IP.

TCP cung cấp truyền dữ liệu tin cậy, có kiểm soát lỗi và thứ tự gói tin. UDP nhẹ hơn, phù hợp cho ứng dụng cần tốc độ như streaming hoặc game online.

Địa chỉ IP dùng để định danh thiết bị trong mạng. DNS chuyển tên miền dễ nhớ thành địa chỉ IP để trình duyệt có thể kết nối đến máy chủ.`
  },
  {
    title: "Trí tuệ nhân tạo nhập môn",
    subject: "Trí tuệ nhân tạo",
    file_name: "tri-tue-nhan-tao-nhap-mon.pdf",
    file_type: "pdf",
    extracted_text: `Trí tuệ nhân tạo nghiên cứu cách xây dựng hệ thống có khả năng thực hiện những nhiệm vụ thường cần trí thông minh của con người. Các bài toán phổ biến gồm phân loại, dự đoán, nhận dạng ảnh, xử lý ngôn ngữ tự nhiên và lập kế hoạch.

Machine learning là nhánh của AI cho phép mô hình học từ dữ liệu thay vì được lập trình bằng luật cố định. Quy trình thường gồm thu thập dữ liệu, tiền xử lý, huấn luyện, đánh giá và triển khai.

Các khái niệm quan trọng gồm tập huấn luyện, tập kiểm thử, overfitting, underfitting, độ chính xác, precision, recall và F1-score.`
  },
  {
    title: "Lập trình web với React",
    subject: "Lập trình web",
    file_name: "lap-trinh-web-react.docx",
    file_type: "docx",
    extracted_text: `React là thư viện JavaScript dùng để xây dựng giao diện người dùng dựa trên component. Component giúp chia nhỏ giao diện thành các phần độc lập, dễ tái sử dụng và dễ kiểm thử.

State biểu diễn dữ liệu thay đổi theo thời gian trong component. Props dùng để truyền dữ liệu từ component cha xuống component con. Hook như useState và useEffect giúp quản lý trạng thái và side effect trong function component.

Khi xây dựng ứng dụng React, cần chú ý cấu trúc component, quản lý API call, xử lý loading/error và tối ưu trải nghiệm người dùng.`
  }
];

const tasks = [
  { title: "Ôn use case và sequence diagram", subject: "Công nghệ phần mềm", due_date: "2026-07-08", description: "Làm lại ví dụ đăng nhập và upload tài liệu." },
  { title: "Luyện SQL JOIN", subject: "Cơ sở dữ liệu", due_date: "2026-07-10", description: "Ôn inner join, left join và group by." },
  { title: "Đọc TCP/IP", subject: "Mạng máy tính", due_date: "2026-07-12", description: "Tóm tắt khác nhau giữa TCP và UDP." },
  { title: "Tạo flashcard AI", subject: "Trí tuệ nhân tạo", due_date: "2026-07-15", description: "Ôn precision, recall, overfitting." }
];

function buildSummary(document) {
  return `Tóm tắt ngắn:
- ${document.title} trình bày các khái niệm trọng tâm của môn ${document.subject}.
- Nội dung giúp người học nắm thuật ngữ, quy trình và ví dụ áp dụng.
- Có thể dùng tài liệu này để tạo flashcard và quiz ôn tập nhanh.`;
}

function buildFlashcards(document) {
  return [
    {
      question: `${document.title} tập trung vào nội dung gì?`,
      answer: `Tài liệu tập trung vào các khái niệm chính của ${document.subject}.`
    },
    {
      question: "Vì sao nên tóm tắt tài liệu trước khi ôn tập?",
      answer: "Tóm tắt giúp nắm ý chính nhanh hơn và dễ chuyển thành flashcard hoặc quiz."
    },
    {
      question: "Một cách học hiệu quả với tài liệu này là gì?",
      answer: "Đọc nội dung trích xuất, tạo flashcard cho khái niệm và làm quiz để kiểm tra lại."
    }
  ];
}

function buildQuizzes(document) {
  return [
    {
      question: `Tài liệu "${document.title}" thuộc môn nào?`,
      option_a: document.subject,
      option_b: "Thể dục",
      option_c: "Âm nhạc",
      option_d: "Mỹ thuật",
      correct_answer: "A",
      explanation: `Tài liệu được gắn với môn ${document.subject}.`
    },
    {
      question: "Chức năng nào của StudyAI giúp ôn lại khái niệm dưới dạng câu hỏi ngắn?",
      option_a: "Xóa tài liệu",
      option_b: "Flashcard",
      option_c: "Đăng xuất",
      option_d: "Đổi mật khẩu",
      correct_answer: "B",
      explanation: "Flashcard gồm câu hỏi và câu trả lời ngắn để hỗ trợ ghi nhớ."
    }
  ];
}

async function deleteExistingDemoUser() {
  const { data: existed, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", DEMO_EMAIL)
    .maybeSingle();

  if (error) throw error;
  if (!existed) return;

  const { error: deleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", existed.id);

  if (deleteError) throw deleteError;
}

async function seed() {
  await deleteExistingDemoUser();

  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      full_name: "Người dùng Demo",
      email: DEMO_EMAIL,
      password_hash
    })
    .select("*")
    .single();

  if (userError) throw userError;

  const subjectNames = [...new Set(documents.map((doc) => doc.subject))];
  const { data: insertedSubjects, error: subjectError } = await supabase
    .from("subjects")
    .insert(subjectNames.map((name) => ({
      user_id: user.id,
      name,
      description: `Tài liệu và nhiệm vụ mẫu cho môn ${name}.`
    })))
    .select("*");

  if (subjectError) throw subjectError;

  const subjectByName = Object.fromEntries(insertedSubjects.map((subject) => [subject.name, subject]));

  const { error: taskError } = await supabase
    .from("tasks")
    .insert(tasks.map((task) => ({
      user_id: user.id,
      subject_id: subjectByName[task.subject].id,
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      status: "pending"
    })));

  if (taskError) throw taskError;

  const { data: insertedDocuments, error: documentError } = await supabase
    .from("documents")
    .insert(documents.map((document) => ({
      user_id: user.id,
      subject_id: subjectByName[document.subject].id,
      title: document.title,
      file_name: document.file_name,
      file_type: document.file_type,
      extracted_text: document.extracted_text,
      file_path: null
    })))
    .select("*");

  if (documentError) throw documentError;

  const summaries = insertedDocuments.map((document, index) => ({
    document_id: document.id,
    summary_type: "ai_summary",
    content: buildSummary(documents[index])
  }));

  const flashcards = insertedDocuments.flatMap((document, index) =>
    buildFlashcards(documents[index]).map((card) => ({
      document_id: document.id,
      question: card.question,
      answer: card.answer
    }))
  );

  const quizzes = insertedDocuments.flatMap((document, index) =>
    buildQuizzes(documents[index]).map((quiz) => ({
      document_id: document.id,
      ...quiz
    }))
  );

  const [{ error: summaryError }, { error: flashcardError }, { error: quizError }] = await Promise.all([
    supabase.from("summaries").insert(summaries),
    supabase.from("flashcards").insert(flashcards),
    supabase.from("quizzes").insert(quizzes)
  ]);

  if (summaryError) throw summaryError;
  if (flashcardError) throw flashcardError;
  if (quizError) throw quizError;

  console.log("Seeded example account successfully.");
  console.log(`Email: ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);
  console.log(`Subjects: ${insertedSubjects.length}`);
  console.log(`Documents: ${insertedDocuments.length}`);
  console.log(`Flashcards: ${flashcards.length}`);
  console.log(`Quizzes: ${quizzes.length}`);
}

seed().catch((error) => {
  console.error("Failed to seed example account:", error.message);
  process.exit(1);
});

