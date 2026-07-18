import rateLimit, { ipKeyGenerator } from "express-rate-limit";

function limiter(windowMs, limit, message) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
    message: { success: false, message, details: [] }
  });
}

export const apiLimiter = limiter(15 * 60 * 1000, 300, "Bạn thao tác quá nhanh. Vui lòng thử lại sau.");
export const authLimiter = limiter(15 * 60 * 1000, 10, "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi 15 phút.");
export const aiLimiter = limiter(60 * 60 * 1000, 30, "Bạn đã dùng quá giới hạn AI trong giờ này.");
export const uploadLimiter = limiter(60 * 60 * 1000, 20, "Bạn đã upload quá nhiều tài liệu trong giờ này.");
