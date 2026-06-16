import Parser from "rss-parser";

interface RawFeedItem {
  title?: string;
  link?: string;
  id?: string;           // Atom <id> — used by arXiv & GitHub Atom feeds instead of <link>
  content?: string;
  contentSnippet?: string;
  summary?: string;
  isoDate?: string;
  pubDate?: string;
  contentEncoded?: string;
  mediaDescription?: string;
}

const parser: Parser<unknown, RawFeedItem> = new Parser({
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["media:group/media:description", "mediaDescription"],
    ],
  },
});

// Cấu hình instance RSSHub (self-hosted) qua env var RSSHUB_URL.
// Mặc định dùng rsshub.app (public) nếu không có env.
const RSSHUB_BASE = (process.env.RSSHUB_URL ?? "https://rsshub.app").replace(/\/$/, "");

// Chuyển URL trang profile X/Twitter → RSS feed qua RSSHub.
// Lưu URL gốc (vd: https://x.com/drjimfan) trong expert_sources.url —
// cron job tự convert, không cần thêm bảng riêng.
function toRssUrl(url: string): string {
  const xHandle = url.match(/^https?:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,50})\/?$/)?.[1];
  if (xHandle) return `${RSSHUB_BASE}/twitter/user/${xHandle}`;
  return url;
}

export interface FeedItem {
  title: string;
  link: string;
  content: string;
  publishedAt: string;
}

/**
 * Đọc một feed RSS/Atom bất kỳ (Substack, Blog, YouTube channel feed...).
 * rss-parser tự nhận diện định dạng, nên không cần xử lý riêng theo platform.
 * Tự động convert URL profile X/Twitter → RSSHub feed.
 */
export async function fetchFeed(feedUrl: string): Promise<FeedItem[]> {
  const rssUrl = toRssUrl(feedUrl);
  const feed = await parser.parseURL(rssUrl);

  return (feed.items ?? [])
    .filter((item) => item.link || item.id)
    .map((item) => {
      const raw =
        item.contentEncoded || item.content || item.mediaDescription || item.contentSnippet || item.summary || "";

      return {
        title: (item.title ?? "").trim(),
        link: (item.link || item.id)!,
        content: stripHtml(raw),
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      };
    });
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
