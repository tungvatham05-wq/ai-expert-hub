import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized, unauthorized } from "@/lib/chat-auth";

// Next 16: params của route động là Promise → phải await.
type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/chat/sessions/[id] — xoá phiên (ON DELETE CASCADE xoá luôn tin nhắn).
export async function DELETE(req: Request, ctx: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { id } = await ctx.params;

  const { error } = await supabaseAdmin.from("chat_sessions").delete().eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

// PATCH /api/chat/sessions/[id] — đổi tên phiên thủ công. Body: { title: string }.
export async function PATCH(req: Request, ctx: Ctx) {
  if (!isAuthorized(req)) return unauthorized();
  const { id } = await ctx.params;

  let title: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.title === "string") title = body.title.trim();
  } catch {
    // bỏ qua → validate phía dưới
  }
  if (!title) return Response.json({ ok: false, error: "Thiếu title" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .update({ title })
    .eq("id", id)
    .select("id, title, article_id, created_at, updated_at")
    .single();

  if (error || !data) {
    return Response.json({ ok: false, error: error?.message ?? "Not found" }, { status: 404 });
  }
  return Response.json({ ok: true, session: data });
}
