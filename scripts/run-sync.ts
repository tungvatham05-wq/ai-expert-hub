// scripts/run-sync.ts — chạy cron sync thủ công cho các chuyên gia mới
// Usage: npx tsx --env-file=.env.local scripts/run-sync.ts
import { supabaseAdmin } from "../src/lib/supabase";
import { fetchFeed } from "../src/lib/sources";
import { analyzeArticle } from "../src/lib/anthropic";
import { isAiRelated } from "../src/lib/prefilter";

const MAX_ITEMS_PER_SOURCE = 3; // giới hạn nhỏ hơn để chạy nhanh

// Chỉ sync các chuyên gia mới thêm (không chạy lại những người đã có bài)
const NEW_EXPERT_NAMES = [
  "Andrew Ng",
  "Jeremy Howard",
  "Santiago Valdarrama",
  "Demis Hassabis",
  "Dario Amodei",
  "Clément Delangue",
  "Jim Fan",
  "Arthur Mensch",
];

async function linkTags(articleId: string, tagNames: string[]) {
  for (const name of tagNames) {
    const slug = name.replace(/^#/, "").toLowerCase().replace(/\s+/g, "-");
    const { data: tag } = await supabaseAdmin
      .from("tags")
      .upsert({ name, slug }, { onConflict: "name" })
      .select()
      .single();
    if (tag) {
      await supabaseAdmin
        .from("article_tags")
        .insert({ article_id: articleId, tag_id: tag.id })
        .throwOnError();
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
      await supabaseAdmin
        .from("article_ai_tools")
        .insert({ article_id: articleId, ai_tool_id: tool.id })
        .throwOnError();
    }
  }
}

async function main() {
  // Lấy sources của các chuyên gia mới
  const { data: newExperts } = await supabaseAdmin
    .from("experts")
    .select("id, name")
    .in("name", NEW_EXPERT_NAMES);

  if (!newExperts?.length) {
    console.log("Không tìm thấy chuyên gia mới.");
    return;
  }

  const expertIds = newExperts.map((e) => e.id);

  const { data: sources } = await supabaseAdmin
    .from("expert_sources")
    .select("id, url, expert_id")
    .in("expert_id", expertIds)
    .eq("is_active", true);

  if (!sources?.length) {
    console.log("Không có nguồn nào active.");
    return;
  }

  console.log(`\n🔄 Sync ${sources.length} nguồn cho ${newExperts.length} chuyên gia mới\n`);

  let totalProcessed = 0;
  const errors: string[] = [];

  for (const source of sources) {
    const expert = newExperts.find((e) => e.id === source.expert_id);
    console.log(`\n▸ [${expert?.name}] ${source.url}`);

    let items;
    try {
      items = (await fetchFeed(source.url)).slice(0, MAX_ITEMS_PER_SOURCE);
      console.log(`  → ${items.length} bài tìm thấy`);
    } catch (err) {
      const msg = `[fetch] ${source.url}: ${(err as Error).message}`;
      errors.push(msg);
      console.error("  ✗", msg);
      continue;
    }

    for (const item of items) {
      // Bỏ qua nếu đã có
      const { data: existing } = await supabaseAdmin
        .from("articles")
        .select("id")
        .eq("source_url", item.link)
        .maybeSingle();
      if (existing) {
        console.log(`  ✓ Đã có: ${item.title.slice(0, 60)}`);
        continue;
      }

      // Pre-filter: bỏ qua nếu không liên quan AI/tech (tiết kiệm token Claude)
      if (!isAiRelated(item.title, item.content)) {
        console.log(`  ⏭ Bỏ qua (off-topic): ${item.title.slice(0, 60)}`);
        continue;
      }

      // Gọi Claude phân tích
      let analysis;
      try {
        process.stdout.write(`  ⏳ Phân tích: ${item.title.slice(0, 50)}…`);
        analysis = await analyzeArticle(item.title, item.content);
        process.stdout.write(" ✓\n");
      } catch (err) {
        const msg = `[analyze] ${item.link}: ${(err as Error).message}`;
        errors.push(msg);
        console.error("\n  ✗", msg);
        continue;
      }
      // Haiku fallback: bài không liên quan AI/tech
      if (!analysis) {
        console.log(`  ⏭ Haiku bỏ qua (not AI): ${item.title.slice(0, 60)}`);
        continue;
      }

      // Insert bài
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
      totalProcessed++;
      console.log(`  + Đã thêm: "${analysis.title_vi.slice(0, 60)}"`);
    }
  }

  console.log(`\n✅ Xong! Đã xử lý: ${totalProcessed} bài mới`);
  if (errors.length) {
    console.log(`⚠️  ${errors.length} lỗi:`, errors);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
