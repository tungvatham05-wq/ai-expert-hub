import { articles } from "@/lib/mock-data";
import ArticleCard from "@/components/ArticleCard";

export default function Feed() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink sm:text-2xl">Dòng tin</h1>
          <p className="mt-0.5 text-sm text-faint">{articles.length} nội dung mới nhất</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-panel p-1 text-sm">
          <button type="button" className="rounded-lg bg-panel-hover px-3 py-1.5 font-medium text-ink">
            Mới nhất
          </button>
          <button type="button" className="rounded-lg px-3 py-1.5 text-muted hover:text-ink">
            Nổi bật
          </button>
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-faint">Mới hôm nay</p>

      <div className="flex flex-col gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
