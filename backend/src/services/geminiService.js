import dotenv from "dotenv";

dotenv.config();

function stripCodeFence(text) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

export function parseJsonFromAI(text, fallback = []) {
  try {
    return JSON.parse(stripCodeFence(text));
  } catch (error) {
    const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) return fallback;

    try {
      return JSON.parse(match[0]);
    } catch {
      return fallback;
    }
  }
}

function mockResponse(prompt) {
  if (prompt.toLowerCase().includes("flashcard")) {
    return JSON.stringify([
      {
        question: "Mục tiêu chính của tài liệu là gì?",
        answer: "Tài liệu cung cấp các kiến thức cốt lõi để người học nắm được nội dung bài học."
      },
      {
        question: "Vì sao cần tóm tắt tài liệu?",
        answer: "Tóm tắt giúp người học nắm ý chính nhanh hơn và dễ ôn tập trước kỳ thi."
      },
      {
        question: "Flashcard hỗ trợ học tập như thế nào?",
        answer: "Flashcard giúp ghi nhớ khái niệm thông qua câu hỏi và câu trả lời ngắn gọn."
      }
    ]);
  }

  if (prompt.toLowerCase().includes("trắc nghiệm") || prompt.toLowerCase().includes("quiz")) {
    return JSON.stringify([
      {
        question: "Chức năng nào giúp sinh viên nắm nhanh nội dung tài liệu?",
        option_a: "Tóm tắt tài liệu",
        option_b: "Xóa tài liệu",
        option_c: "Đổi mật khẩu",
        option_d: "Đăng xuất",
        correct_answer: "A",
        explanation: "Tóm tắt tài liệu giúp rút gọn nội dung dài thành các ý chính."
      },
      {
        question: "Flashcard thường gồm những thành phần nào?",
        option_a: "Ảnh và nhạc",
        option_b: "Câu hỏi và câu trả lời",
        option_c: "Tài khoản và mật khẩu",
        option_d: "Bảng điểm và học phí",
        correct_answer: "B",
        explanation: "Flashcard là thẻ ghi nhớ gồm mặt câu hỏi và mặt câu trả lời."
      }
    ]);
  }

  return `Tóm tắt ngắn:\n- Tài liệu trình bày các nội dung trọng tâm phục vụ quá trình học tập.\n- Người học cần nắm các khái niệm chính, quy trình và ví dụ minh họa.\n\nCác ý chính:\n- Xác định nội dung quan trọng trong tài liệu.\n- Ghi nhớ các khái niệm cốt lõi.\n- Sử dụng flashcard và câu hỏi ôn tập để củng cố kiến thức.\n\nKhái niệm cần nhớ:\n- Tóm tắt tài liệu.\n- Flashcard.\n- Câu hỏi ôn tập.`;
}

export async function generateContent(prompt) {
  const useMock = process.env.GEMINI_USE_MOCK === "true" || !process.env.GEMINI_API_KEY;

  if (useMock) {
    return mockResponse(prompt);
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n");

  if (!text) {
    throw new Error("AI không trả về nội dung hợp lệ");
  }

  return text.trim();
}
