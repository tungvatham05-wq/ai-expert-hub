// scripts/set-avatars.ts — điền avatar cho các expert đang thiếu.
//  - Kênh YouTube: lấy ảnh kênh qua YouTube Data API (yt3.ggpht.com).
//  - Người không có YouTube: lấy ảnh chân dung từ Wikipedia (upload.wikimedia.org).
// Usage: npx tsx --env-file=.env.local scripts/set-avatars.ts
import { supabaseAdmin } from "../src/lib/supabase";

// Map tên expert (không có nguồn YouTube) -> tiêu đề trang Wikipedia.
const WIKI_TITLES: Record<string, string> = {
  "Andrew Ng": "Andrew Ng",
  "Dario Amodei": "Dario Amodei",
  "Demis Hassabis": "Demis Hassabis",
  "Jim Fan": "Jim Fan",
};

async function youtubeAvatar(channelIds: string[], key: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  // API cho phép tối đa 50 id/lần.
  const r: any = await (
    await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds.join(",")}&key=${key}`)
  ).json();
  for (const it of r.items ?? []) {
    const t = it.snippet.thumbnails;
    const url = t.high?.url ?? t.medium?.url ?? t.default?.url;
    if (url) out.set(it.id, url);
  }
  return out;
}

async function wikiAvatar(title: string): Promise<string | null> {
  const u = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=thumbnail&pithumbsize=400&format=json`;
  const r: any = await (await fetch(u)).json();
  const page: any = Object.values(r.query?.pages ?? {})[0];
  return page?.thumbnail?.source ?? null;
}

async function main() {
  const key = process.env.YOUTUBE_API_KEY!;

  const { data: experts } = await supabaseAdmin
    .from("experts")
    .select("id, name, avatar_url, expert_sources(url, platform)")
    .is("avatar_url", null);

  if (!experts?.length) {
    console.log("Mọi expert đều đã có avatar.");
    return;
  }
  console.log(`\n🖼️  ${experts.length} expert thiếu avatar\n`);

  // Gom channelId của các expert YouTube.
  const channelByExpert = new Map<string, string>();
  for (const e of experts) {
    const ytUrl = (e.expert_sources as { url: string; platform: string }[] | null)?.find((s) => s.platform === "YouTube")?.url;
    const cid = ytUrl?.match(/channel_id=([\w-]+)/)?.[1];
    if (cid) channelByExpert.set(e.id, cid);
  }
  const ytAvatars = channelByExpert.size
    ? await youtubeAvatar([...new Set(channelByExpert.values())], key)
    : new Map<string, string>();

  let updated = 0;
  for (const e of experts) {
    let url: string | null = null;
    const cid = channelByExpert.get(e.id);
    if (cid) {
      url = ytAvatars.get(cid) ?? null;
    } else if (WIKI_TITLES[e.name]) {
      url = await wikiAvatar(WIKI_TITLES[e.name]);
    }

    if (!url) {
      console.log(`  ⏭ Không có nguồn ảnh: ${e.name}`);
      continue;
    }
    const { error } = await supabaseAdmin.from("experts").update({ avatar_url: url }).eq("id", e.id);
    if (error) {
      console.error(`  ✗ ${e.name}: ${error.message}`);
      continue;
    }
    console.log(`  + ${e.name}`);
    updated++;
  }

  console.log(`\n✅ Đã đặt avatar cho ${updated}/${experts.length} expert.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
