import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized, unauthorized } from "@/lib/chat-auth";

// GET /api/chat/sessions — danh sách lịch sử phiên chat (mới cập nhật lên đầu).
export async function GET(req: Request) {
  if (!isAuthorized(req)) return unauthorized();

  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .select("id, title, article_id, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, sessions: data ?? [] });
}

// POST /api/chat/sessions — tạo phiên mới (nút "➕ Cuộc trò chuyện mới").
// Body tuỳ chọn: { article_id?: string } để gắn ngữ cảnh bài đang đọc.
export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();

  let articleId: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.article_id === "string") articleId = body.article_id;
  } catch {
    // body rỗng cũng hợp lệ → phiên không gắn bài
  }

  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .insert({ article_id: articleId })
    .select("id, title, article_id, created_at, updated_at")
    .single();

  if (error || !data) {
    return Response.json({ ok: false, error: error?.message ?? "Insert failed" }, { status: 500 });
  }
  return Response.json({ ok: true, session: data });
}
