const requiredInProduction = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "JWT_SECRET"];

export function validateEnvironment() {
  const missing = requiredInProduction.filter((name) => !process.env[name]);
  if (process.env.NODE_ENV === "production" && missing.length) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${missing.join(", ")}`);
  }
  if (!process.env.GEMINI_API_KEY && process.env.GEMINI_USE_MOCK !== "true") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Thiếu GEMINI_API_KEY hoặc GEMINI_USE_MOCK=true.");
    }
    console.warn("Gemini key chưa cấu hình; backend sẽ dùng mock mode.");
  }
  if (String(process.env.SUPABASE_URL || "").includes("/rest/v1")) {
    throw new Error("SUPABASE_URL phải là project base URL, không chứa /rest/v1.");
  }
  if (process.env.NODE_ENV === "production" && String(process.env.JWT_SECRET || "").length < 32) {
    throw new Error("JWT_SECRET ở production phải có ít nhất 32 ký tự.");
  }
}

export function allowedOrigins() {
  return String(process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
