const DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS) || 768;
const MAX_INPUT_CHARS = 10_000;

function tokenize(text) {
  return String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]+/g) || [];
}

function hashToken(token) {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) hash = Math.imul(hash ^ token.charCodeAt(i), 16777619);
  return hash >>> 0;
}

export function generateMockEmbedding(text, dimensions = DIMENSIONS) {
  const vector = new Array(dimensions).fill(0);
  for (const token of tokenize(text)) {
    const hash = hashToken(token);
    vector[hash % dimensions] += 1;
    vector[(hash >>> 8) % dimensions] += 0.35;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / norm).toFixed(8)));
}

function validateInput(text) {
  const value = String(text || "").trim();
  if (!value) throw new Error("Không thể tạo embedding cho nội dung rỗng.");
  if (value.length > MAX_INPUT_CHARS) throw new Error("Nội dung embedding vượt giới hạn cho phép.");
  return value;
}

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function fetchEmbedding(text, taskType) {
  const model = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: `models/${model}`, content: { parts: [{ text }] }, taskType, outputDimensionality: DIMENSIONS })
    });
    if (!response.ok) {
      const error = new Error(response.status === 429 || response.status >= 500 ? "Embedding service tạm thời quá tải." : "Embedding service từ chối dữ liệu.");
      error.retryable = response.status === 429 || response.status >= 500;
      throw error;
    }
    const values = (await response.json()).embedding?.values;
    if (!Array.isArray(values) || values.length !== DIMENSIONS) throw new Error(`Embedding phải có đúng ${DIMENSIONS} chiều.`);
    return values;
  } finally { clearTimeout(timer); }
}

export async function generateEmbedding(text, { taskType = "RETRIEVAL_DOCUMENT" } = {}) {
  const value = validateInput(text);
  if (process.env.GEMINI_USE_MOCK === "true" || !process.env.GEMINI_API_KEY) return generateMockEmbedding(value);
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { return await fetchEmbedding(value, taskType); }
    catch (error) { lastError = error; if (!error.retryable || attempt === 2) break; await delay(400 * (attempt + 1)); }
  }
  throw new Error(lastError?.message || "Không thể tạo embedding lúc này.");
}

export async function generateEmbeddings(texts, options = {}) {
  const values = texts.map(validateInput);
  const output = [];
  for (let i = 0; i < values.length; i += 8) {
    output.push(...await Promise.all(values.slice(i, i + 8).map((text) => generateEmbedding(text, options))));
  }
  return output;
}

