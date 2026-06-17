import { supabaseAdmin } from "@/lib/supabase";
import { generatePodcastScript, synthesizePodcastAudio, normalizeVoice } from "@/lib/podcast";

// Sinh kịch bản (gpt-4o-mini) + tổng hợp giọng (TTS) có thể lâu hơn 10s mặc định Hobby.
export const maxDuration = 60;

const BUCKET = "podcasts";

type Ctx = { params: Promise<{ articleId: string }> };

// GET /api/podcast/[articleId]?voice=male|female — lazy generate + cache (riêng từng giọng):
//   male   → cột podcast_url        , file `${articleId}.mp3`
//   female → cột podcast_url_female , file `${articleId}-female.mp3`
// 1) nếu cột tương ứng đã có URL → trả thẳng (cached).
// 2) nếu chưa: sinh kịch bản → TTS mp3 (đúng giọng) → upload bucket `podcasts` (public)
//    → lưu URL vào cột tương ứng → trả URL.
// Lưu ý Next 16: params route động là Promise → phải await.
export async function GET(req: Request, ctx: Ctx) {
  const { articleId } = await ctx.params;
  const voice = normalizeVoice(new URL(req.url).searchParams.get("voice"));
  // Cột DB + đường dẫn file phụ thuộc giọng.
  const column = voice === "female" ? "podcast_url_female" : "podcast_url";
  const path = voice === "female" ? `${articleId}-female.mp3` : `${articleId}.mp3`;

  // Lấy bài + URL đã cache cho giọng này (nếu có).
  const { data: article, error: artErr } = await supabaseAdmin
    .from("articles")
    .select(`id, title_vi, original_title, original_content, summary_main_points, summary_actionable, ${column}`)
    .eq("id", articleId)
    .maybeSingle();

  if (artErr) return Response.json({ ok: false, error: artErr.message }, { status: 500 });
  if (!article) return Response.json({ ok: false, error: "Bài viết không tồn tại" }, { status: 404 });

  // 1) Cache hit → trả ngay.
  const cachedUrl = (article as Record<string, unknown>)[column] as string | null;
  if (cachedUrl) {
    return Response.json({ ok: true, url: cachedUrl, voice, cached: true });
  }

  // 2) Sinh kịch bản + giọng nói.
  let audio: Buffer;
  try {
    const script = await generatePodcastScript({
      titleVi: article.title_vi,
      originalTitle: article.original_title,
      summaryPoints: article.summary_main_points,
      actionable: article.summary_actionable,
      content: article.original_content,
    });
    audio = await synthesizePodcastAudio(script, voice);
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }

  // 3) Upload lên Storage (upsert để chạy lại không lỗi "đã tồn tại").
  const { error: upErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, audio, { contentType: "audio/mpeg", upsert: true });
  if (upErr) return Response.json({ ok: false, error: upErr.message }, { status: 500 });

  const url = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  // 4) Cache URL vào cột tương ứng (lỗi update không làm hỏng response — vẫn trả URL vừa tạo).
  const { error: updErr } = await supabaseAdmin
    .from("articles")
    .update({ [column]: url })
    .eq("id", articleId);
  if (updErr) {
    return Response.json({ ok: true, url, voice, cached: false, warning: updErr.message });
  }

  return Response.json({ ok: true, url, voice, cached: false });
}
