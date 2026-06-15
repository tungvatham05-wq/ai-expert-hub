import Parser from "rss-parser";

interface RawFeedItem {
  title?: string;
  link?: string;
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

export interface FeedItem {
  title: string;
  link: string;
  content: string;
  publishedAt: string;
}

/**
 * Đọc một feed RSS/Atom bất kỳ (Substack, Blog, YouTube channel feed...).
 * rss-parser tự nhận diện định dạng, nên không cần xử lý riêng theo platform.
 */
export async function fetchFeed(feedUrl: string): Promise<FeedItem[]> {
  const feed = await parser.parseURL(feedUrl);

  return (feed.items ?? [])
    .filter((item) => item.link)
    .map((item) => {
      const raw =
        item.contentEncoded || item.content || item.mediaDescription || item.contentSnippet || item.summary || "";

      return {
        title: (item.title ?? "").trim(),
        link: item.link!,
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
