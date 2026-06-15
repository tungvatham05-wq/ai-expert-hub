import { supabaseAdmin } from "@/lib/supabase";

export type SourcePlatform = "X" | "Bluesky" | "Blog" | "YouTube" | "arXiv" | "GitHub" | "HF Papers";

export interface FeedArticle {
  id: string;
  expertId: string;
  expertName: string;
  expertInitials: string;
  source: SourcePlatform;
  sourceLabel: string;
  time: string;
  isNew: boolean;
  isHot: boolean;
  titleVi: string;
  titleOriginal: string;
  summaryPoints: string[];
  originalSummary: string;
  tags: string[];
  actionableTakeaway: string;
  aiTools: string[];
  bookmarked: boolean;
}

export interface ExpertSummary {
  id: string;
  name: string;
  initials: string;
  articleCount: number;
}

export interface SourceSummary {
  id: string;
  name: SourcePlatform;
  count: number;
  dotColor: string;
}

export interface TrendingTopic {
  tag: string;
  count: number;
}

export interface FeedFilterParams {
  expert?: string;
  source?: string;
  tag?: string;
}

const PLATFORM_DOT_COLORS: Record<SourcePlatform, string> = {
  X: "bg-ink",
  Bluesky: "bg-sky-400",
  Blog: "bg-emerald-400",
  YouTube: "bg-red-500",
  arXiv: "bg-violet-400",
  "HF Papers": "bg-yellow-400",
  GitHub: "bg-slate-300",
};

const PLATFORM_SOURCE_LABELS: Record<SourcePlatform, string> = {
  X: "Bài đăng",
  Bluesky: "Bài đăng",
  Blog: "Bài viết",
  YouTube: "Video",
  arXiv: "Paper",
  GitHub: "Release",
  "HF Papers": "Paper",
};

// Slug ngắn dùng trong URL (?source=...) vì SourcePlatform có khoảng trắng (ví dụ "HF Papers").
const PLATFORM_SLUGS: Record<SourcePlatform, string> = {
  X: "x",
  Bluesky: "bluesky",
  Blog: "blog",
  YouTube: "youtube",
  arXiv: "arxiv",
  "HF Papers": "hfpapers",
  GitHub: "github",
};

const SLUG_TO_PLATFORM: Record<string, SourcePlatform> = Object.fromEntries(
  Object.entries(PLATFORM_SLUGS).map(([platform, slug]) => [slug, platform as SourcePlatform])
);

const NEW_THRESHOLD_MS = 24 * 60 * 60 * 1000;

interface ArticleRow {
  id: string;
  source_url: string;
  original_title: string;
  original_content: string;
  title_vi: string;
  summary_main_points: string;
  summary_actionable: string;
  published_at: string;
  created_at: string;
  expert_id: string;
  experts: { id: string; name: string } | null;
  article_tags: { tags: { name: string } | null }[];
  article_ai_tools: { ai_tools: { name: string } | null }[];
}

function detectPlatform(url: string): SourcePlatform {
  if (/github\.com/i.test(url)) return "GitHub";
  if (/(?:twitter|x)\.com/i.test(url)) return "X";
  if (/bsky\.app/i.test(url)) return "Bluesky";
  if (/youtube\.com|youtu\.be/i.test(url)) return "YouTube";
  if (/arxiv\.org/i.test(url)) return "arXiv";
  if (/huggingface\.co\/papers/i.test(url)) return "HF Papers";
  return "Blog";
}

function getInitials(name: string): string {
  const paren = name.match(/\(([^)]+)\)/);
  const base = (paren ? paren[1] : name).trim();
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

function parseSummaryPoints(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

export async function getAllArticles(): Promise<FeedArticle[]> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select(
      `
      id,
      source_url,
      original_title,
      original_content,
      title_vi,
      summary_main_points,
      summary_actionable,
      published_at,
      created_at,
      expert_id,
      experts ( id, name ),
      article_tags ( tags ( name ) ),
      article_ai_tools ( ai_tools ( name ) )
    `
    )
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Không thể tải danh sách bài viết: ${error.message}`);
  }

  return (data as unknown as ArticleRow[]).map((row) => {
    const platform = detectPlatform(row.source_url);
    const expertName = row.experts?.name ?? "Không rõ";

    return {
      id: row.id,
      expertId: row.expert_id,
      expertName,
      expertInitials: getInitials(expertName),
      source: platform,
      sourceLabel: PLATFORM_SOURCE_LABELS[platform],
      time: formatRelativeTime(row.published_at),
      isNew: Date.now() - new Date(row.created_at).getTime() < NEW_THRESHOLD_MS,
      isHot: false,
      titleVi: row.title_vi,
      titleOriginal: row.original_title,
      summaryPoints: parseSummaryPoints(row.summary_main_points),
      originalSummary: truncate(decodeHtmlEntities(stripHtml(row.original_content)), 600),
      tags: row.article_tags.map((t) => t.tags?.name).filter((t): t is string => Boolean(t)),
      actionableTakeaway: row.summary_actionable,
      aiTools: row.article_ai_tools.map((t) => t.ai_tools?.name).filter((t): t is string => Boolean(t)),
      bookmarked: false,
    };
  });
}

export function filterArticles(articles: FeedArticle[], filters: FeedFilterParams): FeedArticle[] {
  const platform = filters.source ? SLUG_TO_PLATFORM[filters.source] : undefined;
  return articles.filter((a) => {
    if (filters.expert && a.expertId !== filters.expert) return false;
    if (platform && a.source !== platform) return false;
    if (filters.tag && !a.tags.includes(filters.tag)) return false;
    return true;
  });
}

export function getExpertCounts(articles: FeedArticle[]): ExpertSummary[] {
  const byId = new Map<string, ExpertSummary>();
  for (const a of articles) {
    const existing = byId.get(a.expertId);
    if (existing) {
      existing.articleCount += 1;
    } else {
      byId.set(a.expertId, {
        id: a.expertId,
        name: a.expertName,
        initials: a.expertInitials,
        articleCount: 1,
      });
    }
  }
  return [...byId.values()].sort((x, y) => y.articleCount - x.articleCount);
}

export function getSourceCounts(articles: FeedArticle[]): SourceSummary[] {
  const order: SourcePlatform[] = ["X", "Bluesky", "Blog", "YouTube", "arXiv", "HF Papers", "GitHub"];
  const counts = new Map<SourcePlatform, number>();
  for (const a of articles) {
    counts.set(a.source, (counts.get(a.source) ?? 0) + 1);
  }
  return order
    .filter((platform) => counts.has(platform))
    .map((platform) => ({
      id: PLATFORM_SLUGS[platform],
      name: platform,
      count: counts.get(platform)!,
      dotColor: PLATFORM_DOT_COLORS[platform],
    }));
}

export function getTrendingTags(articles: FeedArticle[], limit = 8): TrendingTopic[] {
  const counts = new Map<string, number>();
  for (const a of articles) {
    for (const tag of a.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

// Bật/tắt một bộ lọc, giữ nguyên các bộ lọc khác đang áp dụng.
export function buildFilterHref(current: FeedFilterParams, key: keyof FeedFilterParams, value: string): string {
  const next = { ...current };
  if (next[key] === value) {
    delete next[key];
  } else {
    next[key] = value;
  }
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
