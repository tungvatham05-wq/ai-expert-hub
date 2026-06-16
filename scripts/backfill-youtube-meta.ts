// scripts/backfill-youtube-meta.ts — điền duration_seconds (+thumbnail HD) cho các
// video YouTube đã lưu trước khi có YOUTUBE_API_KEY.
// Usage: npx tsx --env-file=.env.local scripts/backfill-youtube-meta.ts
import { supabaseAdmin } from "../src/lib/supabase";
import { extractVideoId, fetchYouTubeMeta } from "../src/lib/youtube";

async function main() {
  const { data: rows } = await supabaseAdmin
    .from("articles")
    .select("id, source_url, duration_seconds")
    .or("source_url.ilike.%youtube.com%,source_url.ilike.%youtu.be%");

  const targets = (rows ?? []).filter((r) => r.duration_seconds == null);
  console.log(`\n🔄 Backfill meta cho ${targets.length}/${rows?.length ?? 0} video YouTube\n`);

  let updated = 0;
  for (const row of targets) {
    const videoId = extractVideoId(row.source_url);
    if (!videoId) {
      console.log(`  ⏭ Không tách được videoId: ${row.source_url}`);
      continue;
    }
    const meta = await fetchYouTubeMeta(videoId);
    const { error } = await supabaseAdmin
      .from("articles")
      .update({ duration_seconds: meta.durationSeconds, thumbnail_url: meta.thumbnailUrl })
      .eq("id", row.id);
    if (error) {
      console.error(`  ✗ ${videoId}: ${error.message}`);
      continue;
    }
    const mins = meta.durationSeconds ? `${Math.round(meta.durationSeconds / 60)}p` : "n/a";
    console.log(`  + ${videoId} → ${mins}`);
    updated++;
  }

  console.log(`\n✅ Đã cập nhật ${updated} video.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
