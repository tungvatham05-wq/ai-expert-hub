import type { FeedArticle } from "@/lib/articles";

// Bỏ dấu tiếng Việt + viết thường để so khớp tìm kiếm không phân biệt dấu/hoa-thường.
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

export function matchesSearch(article: FeedArticle, query: string): boolean {
  const q = normalizeSearchText(query.trim());
  if (!q) return true;
  const haystack = normalizeSearchText(
    [article.titleVi, article.titleOriginal, article.expertName, article.summaryPoints.join(" "), article.originalSummary].join(" ")
  );
  return haystack.includes(q);
}
