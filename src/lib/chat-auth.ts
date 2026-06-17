import { timingSafeEqual } from "crypto";

// Gác cổng chatbot: chỉ Admin (biết ADMIN_CHAT_PASSWORD) mới gọi được API.
// Frontend gửi mật khẩu qua header "x-admin-password" trên MỌI request.
// Toàn bộ truy cập DB đi qua route handler (service role) → không cần RLS.
const PASSWORD_HEADER = "x-admin-password";

/** So sánh hằng-thời-gian để tránh rò rỉ qua timing attack. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** true nếu request mang đúng mật khẩu Admin. */
export function isAuthorized(req: Request): boolean {
  const expected = process.env.ADMIN_CHAT_PASSWORD;
  if (!expected) return false; // chưa cấu hình mật khẩu → khoá toàn bộ cho an toàn
  const provided = req.headers.get(PASSWORD_HEADER);
  if (!provided) return false;
  return safeEqual(provided, expected);
}

/** Response 401 dùng chung cho các route khi sai/thiếu mật khẩu. */
export function unauthorized(): Response {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
