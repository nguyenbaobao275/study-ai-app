import dotenv from "dotenv";
dotenv.config();

function stripCodeFence(text) {
  return String(text || "").replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

export function parseJsonFromAI(text, fallback = []) {
  try { return JSON.parse(stripCodeFence(text)); }
  catch {
    const match = String(text || "").match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) return fallback;
    try { return JSON.parse(match[0]); } catch { return fallback; }
  }
}

function requestedCount(prompt, fallback) {
  const matches = [...String(prompt).matchAll(/(?:đúng|tạo|create)\s+(\d{1,2})\s+(?:câu|flashcard|question)/gi)];
  return Math.min(30, Math.max(1, Number(matches.at(-1)?.[1]) || fallback));
}

function mockResponse(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes("used_source_numbers")) {
    return JSON.stringify({ answer: "Nội dung được trả lời dựa trên các đoạn tài liệu đã truy xuất [Nguồn 1].", used_source_numbers: [1] });
  }
  if (lower.includes("flashcard")) {
    return JSON.stringify(Array.from({ length: requestedCount(prompt, 10) }, (_, index) => ({
      question: `Khái niệm trọng tâm số ${index + 1} trong tài liệu là gì?`,
      answer: `Đây là nội dung ôn tập số ${index + 1}, được tạo từ tài liệu.`
    })));
  }
  if (lower.includes("trắc nghiệm") || lower.includes("quiz")) {
    const offset = Number(prompt.match(/MOCK_OFFSET=(\d+)/)?.[1] || 0);
    return JSON.stringify(Array.from({ length: requestedCount(prompt, 5) }, (_, index) => ({
      question: `Câu hỏi ôn tập số ${offset + index + 1} dựa trên tài liệu?`, option_a: "Phương án đúng", option_b: "Phương án nhiễu B",
      option_c: "Phương án nhiễu C", option_d: "Phương án nhiễu D", correct_answer: "A", explanation: "Đáp án A phù hợp với nội dung tài liệu."
    })));
  }
  return "Tóm tắt tài liệu ở chế độ mock:\n- Các ý chính được tổng hợp từ toàn bộ phần nội dung đã chọn.\n- Người học nên đối chiếu lại tài liệu gốc khi ôn tập.";
}

export async function generateContent(prompt) {
  if (process.env.GEMINI_USE_MOCK === "true" || !process.env.GEMINI_API_KEY) return mockResponse(prompt);
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    if (!response.ok) {
      const detail = String(data.error?.message || "Dịch vụ Gemini từ chối yêu cầu.").slice(0, 300);
      const error = new Error(`Gemini ${response.status}: ${detail}`);
      error.statusCode = response.status === 429 ? 429 : 502;
      error.publicMessage = response.status === 404
        ? `Model Gemini "${model}" không khả dụng. Hãy cập nhật GEMINI_MODEL trong backend/.env.`
        : "Gemini không thể xử lý yêu cầu. Hãy kiểm tra API key, hạn mức và cấu hình model.";
      throw error;
    }
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n");
    if (!text) throw new Error("AI không trả về nội dung hợp lệ.");
    return text.trim();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Yêu cầu AI đã quá thời gian chờ.");
    throw error;
  } finally { clearTimeout(timer); }
}
