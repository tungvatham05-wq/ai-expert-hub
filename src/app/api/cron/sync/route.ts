import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchFeed } from "@/lib/sources";
import { analyzeArticle, type ArticleAnalysis } from "@/lib/anthropic";
import { detectPlatform } from "@/lib/platform";
import { analyzeYouTubeItem, type YouTubeMeta } from "@/lib/youtube";
import { isAiRelated } from "@/lib/prefilter";

// Chỉ xử lý N bài mới nhất mỗi nguồn / mỗi lần chạy, tránh tốn API
// khi một nguồn mới được thêm vào có hàng chục bài cũ trong feed.
const MAX_ITEMS_PER_SOURCE = 5;

// Tận dụng tối đa thời gian chạy cho phép trên Vercel Hobby (mặc định chỉ 10s,
// không đủ cho nhiều lệnh gọi Claude liên tiếp).
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Toàn bộ danh sách nguồn được đọc từ DB — thêm/xoá chuyên gia chỉ cần
  // sửa bảng expert_sources trên Supabase, không cần sửa code.
  const { data: sources, error } = await supabaseAdmin
    .from("expert_sources")
    .select("id, url, expert_id")
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let processed = 0;
  const errors: string[] = [];

  for (const source of sources ?? []) {
    let items;
    try {
      items = (await fetchFeed(source.url)).slice(0, MAX_ITEMS_PER_SOURCE);
    } catch (err) {
      errors.push(`[fetch] ${source.url}: ${(err as Error).message}`);
      continue;
    }

    for (const item of items) {
      const { data: existing } = await supabaseAdmin
        .from("articles")
        .select("id")
        .eq("source_url", item.link)
        .maybeSingle();
      if (existing) continue;

      // Pre-filter: skip non-AI/tech content before calling any LLM (saves tokens)
      if (!isAiRelated(item.title, item.content)) continue;

      // ĐỊNH TUYẾN MODEL theo nguồn tin (suy ra từ URL bài viết):
      //   - YouTube            → OpenAI gpt-4o-mini (xử lý video theo mốc thời gian)
      //   - Blog/Substack/khác → Claude Haiku (dịch + bóc tách chuyên sâu)
      const platform = detectPlatform(item.link);

      let analysis: ArticleAnalysis | null;
      let videoMeta: YouTubeMeta | null = null;
      try {
        if (platform === "YouTube") {
          const result = await analyzeYouTubeItem(item.title, item.content, item.link);
          analysis = result.analysis;
          videoMeta = result.meta;
        } else {
          analysis = await analyzeArticle(item.title, item.content);
        }
      } catch (err) {
        errors.push(`[analyze:${platform}] ${item.link}: ${(err as Error).message}`);
        continue;
      }
      // Fallback: model gắn cờ nội dung không liên quan AI/tech → bỏ qua, không tính lỗi
      if (!analysis) continue;

      const { data: article, error: insertError } = await supabaseAdmin
        .from("articles")
        .insert({
          expert_id: source.expert_id,
          source_url: item.link,
          original_title: item.title,
          original_content: item.content,
          title_vi: analysis.title_vi,
          summary_main_points: analysis.summary_points.map((p) => `- ${p}`).join("\n"),
          summary_actionable: analysis.actionable_takeaway,
          published_at: item.publishedAt,
          status: "translated",
          // Chỉ video YouTube mới có 2 trường này; bài khác để null.
          thumbnail_url: videoMeta?.thumbnailUrl ?? null,
          duration_seconds: videoMeta?.durationSeconds ?? null,
        })
        .select()
        .single();

      if (insertError || !article) {
        errors.push(`[insert] ${item.link}: ${insertError?.message}`);
        continue;
      }

      await linkTags(article.id, analysis.tags);
      await linkAiTools(article.id, analysis.ai_tools);
      processed++;
    }
  }

  return NextResponse.json({ ok: true, sources: sources?.length ?? 0, processed, errors });
}

async function linkTags(articleId: string, tagNames: string[]) {
  for (const name of [...new Set(tagNames)]) {
    const slug = name.replace(/^#/, "").toLowerCase().replace(/\s+/g, "-");
    const { data: tag } = await supabaseAdmin
      .from("tags")
      .upsert({ name, slug }, { onConflict: "name" })
      .select()
      .single();
    if (tag) {
      await supabaseAdmin.from("article_tags").upsert(
        { article_id: articleId, tag_id: tag.id },
        { onConflict: "article_id,tag_id", ignoreDuplicates: true }
      );
    }
  }
}

async function linkAiTools(articleId: string, toolNames: string[]) {
  for (const name of [...new Set(toolNames)]) {
    const { data: tool } = await supabaseAdmin
      .from("ai_tools")
      .upsert({ name }, { onConflict: "name" })
      .select()
      .single();
    if (tool) {
      await supabaseAdmin.from("article_ai_tools").upsert(
        { article_id: articleId, ai_tool_id: tool.id },
        { onConflict: "article_id,ai_tool_id", ignoreDuplicates: true }
      );
    }
  }
}
