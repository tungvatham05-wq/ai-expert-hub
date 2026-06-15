import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchFeed } from "@/lib/sources";
import { analyzeArticle } from "@/lib/anthropic";

// Chỉ xử lý N bài mới nhất mỗi nguồn / mỗi lần chạy, tránh tốn API
// khi một nguồn mới được thêm vào có hàng chục bài cũ trong feed.
const MAX_ITEMS_PER_SOURCE = 5;

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

      let analysis;
      try {
        analysis = await analyzeArticle(item.title, item.content);
      } catch (err) {
        errors.push(`[analyze] ${item.link}: ${(err as Error).message}`);
        continue;
      }

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
  for (const name of tagNames) {
    const slug = name.replace(/^#/, "").toLowerCase().replace(/\s+/g, "-");
    const { data: tag } = await supabaseAdmin
      .from("tags")
      .upsert({ name, slug }, { onConflict: "name" })
      .select()
      .single();
    if (tag) {
      await supabaseAdmin.from("article_tags").insert({ article_id: articleId, tag_id: tag.id });
    }
  }
}

async function linkAiTools(articleId: string, toolNames: string[]) {
  for (const name of toolNames) {
    const { data: tool } = await supabaseAdmin
      .from("ai_tools")
      .upsert({ name }, { onConflict: "name" })
      .select()
      .single();
    if (tool) {
      await supabaseAdmin.from("article_ai_tools").insert({ article_id: articleId, ai_tool_id: tool.id });
    }
  }
}
