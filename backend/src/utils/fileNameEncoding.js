const MOJIBAKE_PATTERN = /Ã|Â|Ä|Æ|áº|á»|â€|�/;

export function fixVietnameseFileName(fileName = "") {
  if (!fileName || !MOJIBAKE_PATTERN.test(fileName)) {
    return fileName;
  }

  try {
    const decoded = Buffer.from(fileName, "latin1").toString("utf8");
    return decoded.includes("�") ? fileName : decoded;
  } catch {
    return fileName;
  }
}

export function normalizeDocumentFileName(document) {
  if (!document) return document;

  return {
    ...document,
    file_name: fixVietnameseFileName(document.file_name)
  };
}

