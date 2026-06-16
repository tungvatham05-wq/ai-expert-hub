// scripts/sync-youtube-test.ts — sync THỬ chỉ các kênh YouTube để test tính năng.
// Usage: npx tsx --env-file=.env.local scripts/sync-youtube-test.ts
import { supabaseAdmin } from "../src/lib/supabase";
import { fetchFeed } from "../src/lib/sources";
import { analyzeYouTubeItem } from "../src/lib/youtube";
import { isAiRelated } from "../src/lib/prefilter";

const MAX_ITEMS_PER_SOURCE = 2; // "vài vid" mỗi kênh — giữ nhỏ để chạy nhanh & rẻ

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

async function main() {
  // Chỉ lấy nguồn YouTube (platform được set sẵn khi insert expert_sources).
  const { data: sources } = await supabaseAdmin
    .from("expert_sources")
    .select("id, url, expert_id, experts(name)")
    .eq("platform", "YouTube")
    .eq("is_active", true);

  if (!sources?.length) {
    console.log("Không có nguồn YouTube nào active.");
    return;
  }

  console.log(`\n🔄 Sync thử ${sources.length} kênh YouTube (tối đa ${MAX_ITEMS_PER_SOURCE} vid/kênh)\n`);

  let processed = 0;
  const errors: string[] = [];

  for (const source of sources) {
    const name = (source.experts as { name?: string } | null)?.name ?? "?";
    console.log(`\n▸ [${name}]`);

    let items;
    try {
      items = (await fetchFeed(source.url)).slice(0, MAX_ITEMS_PER_SOURCE);
      console.log(`  → ${items.length} video tìm thấy`);
    } catch (err) {
      const msg = `[fetch] ${source.url}: ${(err as Error).message}`;
      errors.push(msg);
      console.error("  ✗", msg);
      continue;
    }

    for (const item of items) {
      const { data: existing } = await supabaseAdmin
        .from("articles")
        .select("id")
        .eq("source_url", item.link)
        .maybeSingle();
      if (existing) {
        console.log(`  ✓ Đã có: ${item.title.slice(0, 55)}`);
        continue;
      }

      if (!isAiRelated(item.title, item.content)) {
        console.log(`  ⏭ Off-topic: ${item.title.slice(0, 55)}`);
        continue;
      }

      let result;
      try {
        process.stdout.write(`  ⏳ GPT-4o-mini: ${item.title.slice(0, 45)}…`);
        result = await analyzeYouTubeItem(item.title, item.content, item.link);
        process.stdout.write(" ✓\n");
      } catch (err) {
        const msg = `[analyze] ${item.link}: ${(err as Error).message}`;
        errors.push(msg);
        console.error("\n  ✗", msg);
        continue;
      }
      if (!result.analysis) {
        console.log(`  ⏭ GPT bỏ qua (not AI): ${item.title.slice(0, 55)}`);
        continue;
      }

      const { analysis, meta } = result;
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
          thumbnail_url: meta?.thumbnailUrl ?? null,
          duration_seconds: meta?.durationSeconds ?? null,
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
      const dur = meta?.durationSeconds ? ` (${Math.round(meta.durationSeconds / 60)}p)` : "";
      console.log(`  + Đã thêm${dur}: "${analysis.title_vi.slice(0, 55)}"`);
    }
  }

  console.log(`\n✅ Xong! Đã thêm ${processed} video mới.`);
  if (errors.length) console.log(`⚠️  ${errors.length} lỗi:`, errors);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
