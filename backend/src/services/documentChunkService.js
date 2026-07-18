const DEFAULT_TARGET = 1000;
const DEFAULT_OVERLAP = 180;

function sentenceBoundary(text, from, desiredEnd) {
  const maxEnd = Math.min(text.length, desiredEnd + 180);
  const minEnd = Math.min(text.length, Math.max(from + 300, desiredEnd - 180));
  const window = text.slice(minEnd, maxEnd);
  const match = window.match(/[.!?](?:\s|\n)|\n\n/);
  return match ? minEnd + match.index + match[0].length : Math.min(text.length, desiredEnd);
}

export function chunkDocument(text, { targetSize = DEFAULT_TARGET, overlap = DEFAULT_OVERLAP } = {}) {
  const source = String(text || "").trim();
  if (!source) return [];
  const chunks = [];
  let start = 0;
  while (start < source.length) {
    let end = sentenceBoundary(source, start, start + targetSize);
    if (end <= start) end = Math.min(source.length, start + targetSize);
    const raw = source.slice(start, end);
    const leading = raw.search(/\S/);
    const content = raw.trim();
    if (content) {
      const charStart = start + Math.max(0, leading);
      chunks.push({
        chunk_index: chunks.length,
        content,
        page_number: null,
        char_start: charStart,
        char_end: charStart + content.length,
        token_estimate: Math.ceil(content.length / 4),
        metadata: {}
      });
    }
    if (end >= source.length) break;
    const next = Math.max(start + 1, end - overlap);
    start = next;
  }
  return chunks;
}

export function selectDistributedChunks(chunks, maxChunks = 12) {
  if (chunks.length <= maxChunks) return chunks;
  const indexes = new Set();
  for (let i = 0; i < maxChunks; i += 1) indexes.add(Math.round((i * (chunks.length - 1)) / (maxChunks - 1)));
  return [...indexes].sort((a, b) => a - b).map((index) => chunks[index]);
}

