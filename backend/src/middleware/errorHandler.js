export function errorHandler(err, req, res, next) {
  const status = Number(err.statusCode) || 500;
  if (process.env.NODE_ENV !== "test") console.error({ name: err.name, code: err.code, message: err.message });
  const safeMessage = err.publicMessage || (status >= 500 ? "Máy chủ không thể xử lý yêu cầu lúc này." : err.message);
  res.status(status).json({ success: false, message: safeMessage, details: Array.isArray(err.details) ? err.details : [] });
}
