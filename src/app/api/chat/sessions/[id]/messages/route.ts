import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized, unauthorized } from "@/lib/chat-auth";
import {
  generateChatReply,
  generateSessionTitle,
  type ArticleContext,
  type ChatTurn,
} from "@/lib/chat";

// Cho phép chuỗi gọi OpenAI chạy đủ lâu trên Vercel (mặc định Hobby chỉ 10s).
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

// GET /api/chat/sessions/[id]/messages — tải toàn bộ tin nhắn của phiên.
export async function GET(req: Request, ctx: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { id } = await ctx.params;

  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, messages: data ?? [] });
}

// POST /api/chat/sessions/[id]/messages — gửi tin nhắn:
// 1) lưu tin user → 2) gọi gpt-4o-mini (kèm lịch sử + ngữ cảnh bài) →
// 3) lưu tin assistant → 4) cập nhật updated_at → 5) tự đặt tên nếu là câu đầu.
export async function POST(req: Request, ctx: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { id: sessionId } = await ctx.params;

  let content: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.content === "string") content = body.content.trim();
  } catch {
    // validate bên dưới
  }
  if (!content) return Response.json({ ok: false, error: "Thiếu nội dung" }, { status: 400 });

  // Phiên phải tồn tại (và lấy article_id để dựng ngữ cảnh RAG).
  const { data: session, error: sessionErr } = await supabaseAdmin
    .from("chat_sessions")
    .select("id, title, article_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (sessionErr) return Response.json({ ok: false, error: sessionErr.message }, { status: 500 });
  if (!session) return Response.json({ ok: false, error: "Phiên không tồn tại" }, { status: 404 });

  // Lịch sử hiện có (TRƯỚC tin mới) — để biết đây có phải câu hỏi đầu tiên không.
  const { data: history, error: histErr } = await supabaseAdmin
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (histErr) return Response.json({ ok: false, error: histErr.message }, { status: 500 });

  const isFirstMessage = (history ?? []).length === 0;

  // 1) Lưu tin nhắn của user.
  const { data: userMsg, error: userErr } = await supabaseAdmin
    .from("chat_messages")
    .insert({ session_id: sessionId, role: "user", content })
    .select("id, role, content, created_at")
    .single();
  if (userErr || !userMsg) {
    return Response.json({ ok: false, error: userErr?.message ?? "Insert failed" }, { status: 500 });
  }

  // 2) Ngữ cảnh bài báo (nếu phiên gắn article_id).
  let article: ArticleContext | null = null;
  if (session.article_id) {
    const { data: art } = await supabaseAdmin
      .from("articles")
      .select("title_vi, original_title, original_content, source_url")
      .eq("id", session.article_id)
      .maybeSingle();
    if (art) {
      article = {
        title: art.title_vi,
        originalTitle: art.original_title,
        content: art.original_content,
        url: art.source_url,
      };
    }
  }

  // 3) Gọi gpt-4o-mini với toàn bộ lịch sử + câu hỏi mới.
  const turns: ChatTurn[] = [
    ...(history ?? []).map((m) => ({ role: m.role as ChatTurn["role"], content: m.content })),
    { role: "user", content },
  ];

  let reply: string;
  try {
    reply = await generateChatReply(turns, article);
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }

  // 4) Lưu tin nhắn assistant.
  const { data: assistantMsg, error: aErr } = await supabaseAdmin
    .from("chat_messages")
    .insert({ session_id: sessionId, role: "assistant", content: reply })
    .select("id, role, content, created_at")
    .single();
  if (aErr || !assistantMsg) {
    return Response.json({ ok: false, error: aErr?.message ?? "Insert failed" }, { status: 500 });
  }

  // 5) Cập nhật updated_at (để phiên nhảy lên đầu danh sách lịch sử).
  //    Đồng thời tự đặt tên nếu đây là câu hỏi đầu tiên của phiên.
  let newTitle: string | undefined;
  if (isFirstMessage) {
    try {
      newTitle = await generateSessionTitle(content);
    } catch {
      // lỗi đặt tên không được làm hỏng cả request — giữ tên mặc định
    }
  }
  await supabaseAdmin
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString(), ...(newTitle ? { title: newTitle } : {}) })
    .eq("id", sessionId);

  return Response.json({
    ok: true,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    title: newTitle ?? session.title,
  });
}
