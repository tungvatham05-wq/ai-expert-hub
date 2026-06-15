import ArticleCard from "@/components/ArticleCard";
import type { FeedArticle } from "@/lib/articles";

interface FeedProps {
  articles: FeedArticle[];
  total: number;
}

export default function Feed({ articles, total }: FeedProps) {
  const isFiltered = articles.length !== total;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink sm:text-2xl">Dòng tin</h1>
          <p className="mt-0.5 text-sm text-faint">
            {isFiltered ? `${articles.length} / ${total} nội dung` : `${total} nội dung mới nhất`}
          </p>
        </div>
      </div>

      {articles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-panel p-8 text-center text-sm text-faint">
          Không có bài viết nào phù hợp với bộ lọc hiện tại.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
