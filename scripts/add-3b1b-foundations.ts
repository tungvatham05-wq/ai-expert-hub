// scripts/add-3b1b-foundations.ts — thêm THỦ CÔNG các video nền tảng cũ của
// 3Blue1Brown (cũ hơn cửa sổ RSS nên cron không tự lấy).
// Khác cron: LUÔN tải transcript (kể cả video >20 phút) vì đây là video dài,
// curated, cần tóm tắt mốc thời gian chất lượng cao.
// Usage: npx tsx --env-file=.env.local scripts/add-3b1b-foundations.ts
import { supabaseAdmin } from "../src/lib/supabase";
import { analyzeYouTubeVideo } from "../src/lib/openai";
import { fetchYouTubeMeta, fetchTranscript, extractAuthorTimeline } from "../src/lib/youtube";

const EXPERT_NAME = "3Blue1Brown";
const VIDEO_IDS = [
  "aircAruvnKk", // Ch.1 But what is a neural network?
  "IHZwWFHWa-w", // Ch.2 Gradient descent
  "Ilg3gGewQ5U", // Ch.3 Backpropagation, intuitively
  "tIeHLnjs5U8", // Ch.4 Backpropagation calculus
  "wjZofJX0v4M", // Ch.5 Transformers
  "eMlx5fFNoYc", // Ch.6 Attention in transformers
];

async function linkTags(articleId: string, names: string[]) {
  for (const name of [...new Set(names)]) {
    const slug = name.replace(/^#/, "").toLowerCase().replace(/\s+/g, "-");
    const { data: tag } = await supabaseAdmin.from("tags").upsert({ name, slug }, { onConflict: "name" }).select().single();
    if (tag) await supabaseAdmin.from("article_tags").upsert({ article_id: articleId, tag_id: tag.id }, { onConflict: "article_id,tag_id", ignoreDuplicates: true });
  }
}
async function linkAiTools(articleId: string, names: string[]) {
  for (const name of [...new Set(names)]) {
    const { data: tool } = await supabaseAdmin.from("ai_tools").upsert({ name }, { onConflict: "name" }).select().single();
    if (tool) await supabaseAdmin.from("article_ai_tools").upsert({ article_id: articleId, ai_tool_id: tool.id }, { onConflict: "article_id,ai_tool_id", ignoreDuplicates: true });
  }
}

async function main() {
  const key = process.env.YOUTUBE_API_KEY!;

  const { data: expert } = await supabaseAdmin.from("experts").select("id").eq("name", EXPERT_NAME).maybeSingle();
  if (!expert) {
    console.log(`Không tìm thấy chuyên gia "${EXPERT_NAME}". Hãy thêm kênh trước.`);
    return;
  }

  // Lấy title + description + ngày đăng cho tất cả video trong 1 lệnh.
  const meta: any = await (
    await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${VIDEO_IDS.join(",")}&key=${key}`)
  ).json();
  const snippetById = new Map<string, { title: string; description: string; publishedAt: string }>();
  for (const it of meta.items ?? []) {
    snippetById.set(it.id, { title: it.snippet.title, description: it.snippet.description ?? "", publishedAt: it.snippet.publishedAt });
  }

  let added = 0;
  for (const videoId of VIDEO_IDS) {
    const snip = snippetById.get(videoId);
    if (!snip) {
      console.log(`  ✗ Không lấy được snippet: ${videoId}`);
      continue;
    }
    const link = `https://www.youtube.com/watch?v=${videoId}`;

    const { data: existing } = await supabaseAdmin.from("articles").select("id").eq("source_url", link).maybeSingle();
    if (existing) {
      console.log(`  ✓ Đã có: ${snip.title.slice(0, 55)}`);
      continue;
    }

    const ytMeta = await fetchYouTubeMeta(videoId);

    // Ưu tiên timeline tác giả; nếu không có thì LUÔN thử transcript; cuối cùng mới dùng mô tả.
    let sourceText = snip.description;
    const authorTimeline = extractAuthorTimeline(snip.description);
    if (authorTimeline) {
      sourceText = `TIMELINE TÁC GIẢ:\n${authorTimeline}\n\nMÔ TẢ:\n${snip.description}`;
    } else {
      const transcript = await fetchTranscript(videoId);
      if (transcript) sourceText = `PHỤ ĐỀ (kèm mốc thời gian):\n${transcript}`;
    }

    let analysis;
    try {
      process.stdout.write(`  ⏳ ${snip.title.slice(0, 45)}…`);
      analysis = await analyzeYouTubeVideo(snip.title, sourceText);
      process.stdout.write(" ✓\n");
    } catch (err) {
      console.error(`\n  ✗ [analyze] ${videoId}: ${(err as Error).message}`);
      continue;
    }
    if (!analysis) {
      console.log(`  ⏭ GPT bỏ qua (not AI): ${snip.title.slice(0, 55)}`);
      continue;
    }

    const { data: article, error } = await supabaseAdmin
      .from("articles")
      .insert({
        expert_id: expert.id,
        source_url: link,
        original_title: snip.title,
        original_content: sourceText,
        title_vi: analysis.title_vi,
        summary_main_points: analysis.summary_points.map((p) => `- ${p}`).join("\n"),
        summary_actionable: analysis.actionable_takeaway,
        published_at: snip.publishedAt,
        status: "translated",
        thumbnail_url: ytMeta.thumbnailUrl,
        duration_seconds: ytMeta.durationSeconds,
      })
      .select()
      .single();
    if (error || !article) {
      console.error(`  ✗ [insert] ${videoId}: ${error?.message}`);
      continue;
    }

    await linkTags(article.id, analysis.tags);
    await linkAiTools(article.id, analysis.ai_tools);
    added++;
    const mins = ytMeta.durationSeconds ? `${Math.round(ytMeta.durationSeconds / 60)}p` : "n/a";
    console.log(`  + Đã thêm (${mins}): "${analysis.title_vi.slice(0, 55)}"`);
  }

  console.log(`\n✅ Xong! Đã thêm ${added}/${VIDEO_IDS.length} video nền tảng.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
