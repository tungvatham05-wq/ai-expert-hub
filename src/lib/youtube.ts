// Tiện ích xử lý nguồn YouTube cho pipeline tóm tắt.
// Triết lý "thắt lưng buộc bụng": ưu tiên dữ liệu RẺ (description, timeline tác giả tự
// viết) trước; chỉ tải transcript (tốn băng thông + có thể bị rate-limit) khi video ngắn.

import { YoutubeTranscript } from "youtube-transcript";
import { extractVideoId } from "@/lib/platform";
import { analyzeYouTubeVideo } from "@/lib/openai";
import type { ArticleAnalysis } from "@/lib/anthropic";

// Re-export helper thuần từ platform.ts để code backend chỉ cần import 1 chỗ.
export { extractVideoId, watchUrl } from "@/lib/platform";

// Ngưỡng "thắt lưng buộc bụng": chỉ tải transcript cho video dưới mốc này.
export const YOUTUBE_MAX_TRANSCRIPT_SECONDS = 20 * 60;

export interface YouTubeMeta {
  videoId: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null; // null khi không lấy được (không có YOUTUBE_API_KEY)
}

/** Chuyển "PT15M30S" (ISO-8601 của YouTube Data API) → tổng số giây. */
function parseIso8601Duration(iso: string): number | null {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const [h, min, s] = [m[1], m[2], m[3]].map((v) => (v ? parseInt(v, 10) : 0));
  return h * 3600 + min * 60 + s;
}

/**
 * Lấy thumbnail + thời lượng video.
 * - Nếu có YOUTUBE_API_KEY → dùng Data API v3 (chính xác cả thời lượng).
 * - Nếu không → fallback oEmbed (chỉ có thumbnail, KHÔNG có thời lượng).
 * Không bao giờ throw: lỗi mạng/quota chỉ trả về dữ liệu rỗng để pipeline chạy tiếp.
 */
export async function fetchYouTubeMeta(videoId: string): Promise<YouTubeMeta> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const fallbackThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (apiKey) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${apiKey}`
      );
      if (res.ok) {
        const json = (await res.json()) as {
          items?: { contentDetails?: { duration?: string }; snippet?: { thumbnails?: Record<string, { url: string }> } }[];
        };
        const item = json.items?.[0];
        const thumbs = item?.snippet?.thumbnails;
        return {
          videoId,
          durationSeconds: item?.contentDetails?.duration
            ? parseIso8601Duration(item.contentDetails.duration)
            : null,
          thumbnailUrl: thumbs?.maxres?.url ?? thumbs?.high?.url ?? thumbs?.medium?.url ?? fallbackThumb,
        };
      }
    } catch {
      /* rơi xuống fallback bên dưới */
    }
  }

  // Fallback: i.ytimg.com luôn có sẵn thumbnail theo videoId, không cần gọi API.
  return { videoId, durationSeconds: null, thumbnailUrl: fallbackThumb };
}

// Một dòng timeline: "0:00 Intro", "(12:30) Demo", "[1:02:11] Q&A"...
const TIMESTAMP_LINE = /^\s*(?:\(|\[)?\d{1,2}:\d{2}(?::\d{2})?(?:\)|\])?\s+\S/;

/**
 * Phát hiện timeline do CHÍNH TÁC GIẢ viết trong phần Mô tả
 * (nhiều dòng dạng "0:00 Intro", "12:30 Demo"...). Nếu có thì đây là nguồn
 * tóm tắt rẻ & chất lượng nhất — dùng luôn, khỏi tải transcript.
 */
export function extractAuthorTimeline(description: string): string | null {
  if (!description) return null;
  const tsLines = description.split(/\r?\n/).filter((l) => TIMESTAMP_LINE.test(l));
  // Cần ít nhất 3 mốc mới coi là timeline thực sự (tránh nhầm 1 dòng lẻ).
  return tsLines.length >= 3 ? tsLines.join("\n") : null;
}

const SECONDS_PER_MINUTE = 60;

/** Định dạng giây → "M:SS" cho mỗi dòng transcript. */
function formatOffset(seconds: number): string {
  const m = Math.floor(seconds / SECONDS_PER_MINUTE);
  const s = Math.floor(seconds % SECONDS_PER_MINUTE);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Tải transcript (phụ đề) và gắn mốc thời gian "[M:SS] ...".
 * Trả về null nếu video tắt phụ đề / không lấy được — caller tự fallback.
 */
export async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    if (!items?.length) return null;
    return items
      .map((it) => {
        // youtube-transcript trả offset theo mili-giây.
        const sec = it.offset > 10_000 ? it.offset / 1000 : it.offset;
        return `[${formatOffset(sec)}] ${it.text}`;
      })
      .join("\n");
  } catch {
    return null;
  }
}

/**
 * Pipeline đầy đủ cho 1 video YouTube (dùng chung cho cron route lẫn script test):
 *   1. Luôn lấy meta (thumbnail + thời lượng) — rẻ, phục vụ cả UI.
 *   2. Ưu tiên timeline tác giả tự viết trong Mô tả → dùng luôn, khỏi tải transcript.
 *   3. Nếu không có timeline VÀ video < 20 phút → mới tải transcript.
 *      (Thiếu YOUTUBE_API_KEY nên không biết thời lượng → KHÔNG tải, chỉ dùng mô tả.)
 *   4. Ném nội dung gom được cho gpt-4o-mini.
 * Trả về analysis = null khi GPT gắn cờ should_skip (không liên quan AI/tech).
 */
export async function analyzeYouTubeItem(
  title: string,
  description: string,
  link: string
): Promise<{ analysis: ArticleAnalysis | null; meta: YouTubeMeta | null }> {
  const videoId = extractVideoId(link);
  if (!videoId) {
    // Không tách được videoId → vẫn nhờ GPT tóm tắt phần mô tả, không có meta.
    return { analysis: await analyzeYouTubeVideo(title, description), meta: null };
  }

  const meta = await fetchYouTubeMeta(videoId);

  let sourceText = description;
  const authorTimeline = extractAuthorTimeline(description);

  if (authorTimeline) {
    sourceText = `TIMELINE TÁC GIẢ:\n${authorTimeline}\n\nMÔ TẢ:\n${description}`;
  } else if (meta.durationSeconds !== null && meta.durationSeconds < YOUTUBE_MAX_TRANSCRIPT_SECONDS) {
    const transcript = await fetchTranscript(videoId);
    if (transcript) sourceText = `PHỤ ĐỀ (kèm mốc thời gian):\n${transcript}`;
  }

  return { analysis: await analyzeYouTubeVideo(title, sourceText), meta };
}
