import { isAuthorized, unauthorized } from "@/lib/chat-auth";

// POST /api/chat/auth — kiểm tra mật khẩu cho màn hình đăng nhập của sidebar.
// Frontend gọi 1 lần để xác thực trước khi mở khung chat.
export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  return Response.json({ ok: true });
}
