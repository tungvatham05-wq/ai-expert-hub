"use client";

import { useEffect, useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import type { FeedArticle, FeedFilterParams } from "@/lib/articles";
import { BOOKMARKS_EVENT, getBookmarkIds } from "@/lib/bookmarks";

interface FeedProps {
  articles: FeedArticle[];
  total: number;
  active: FeedFilterParams;
}

export default function Feed({ articles, total, active }: FeedProps) {
  const isSaved = active.filter === "saved";
  const [savedIds, setSavedIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!isSaved) return;
    const update = () => setSavedIds(getBookmarkIds());
    update();
    window.addEventListener(BOOKMARKS_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(BOOKMARKS_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [isSaved]);

  const visibleArticles = isSaved
    ? articles.filter((a) => savedIds?.has(a.id))
    : articles;

  const isFiltered = articles.length !== total;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink sm:text-2xl">Dòng tin</h1>
          <p className="mt-0.5 text-sm text-faint">
            {isSaved
              ? `${visibleArticles.length} bài đã lưu`
              : isFiltered
                ? `${articles.length} / ${total} nội dung`
                : `${total} nội dung mới nhất`}
          </p>
        </div>
      </div>

      {isSaved && savedIds === null ? (
        <div className="flex flex-col gap-4" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-panel" />
          ))}
        </div>
      ) : visibleArticles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-panel p-8 text-center text-sm text-faint">
          {isSaved ? "Bạn chưa lưu bài viết nào." : "Không có bài viết nào phù hợp với bộ lọc hiện tại."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
