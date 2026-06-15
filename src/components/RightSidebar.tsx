import Link from "next/link";
import { buildFilterHref, type FeedFilterParams, type TodayDigest, type TrendingTopic } from "@/lib/articles";

interface RightSidebarProps {
  digest: TodayDigest;
  trending: TrendingTopic[];
  active: FeedFilterParams;
}

export default function RightSidebar({ digest, trending, active }: RightSidebarProps) {
  const maxCount = trending.length > 0 ? Math.max(...trending.map((t) => t.count)) : 1;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      {/* Today's digest */}
      <div className="rounded-2xl border border-border bg-panel p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-faint">📰 Bản tin hôm nay</p>
          <span className="text-[11px] capitalize text-faint">{digest.dateLabel}</span>
        </div>

        <p className="mt-2 text-sm text-muted">
          <span className="font-semibold text-accent">{digest.todayCount}</span>{" "}
          {digest.todayCount === 1 ? "bài viết mới" : "bài viết mới"} trong 24 giờ qua
        </p>

        {digest.recent.length > 0 && (
          <ul className="mt-3 space-y-2.5 border-t border-border pt-3">
            {digest.recent.map((item) => (
              <li key={item.id}>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-0.5"
                >
                  <span className="line-clamp-2 text-sm leading-snug text-ink group-hover:text-accent">
                    {item.titleVi}
                  </span>
                  <span className="text-xs text-faint">
                    {item.expertName} · {item.time}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Trending topics */}
      <div className="rounded-2xl border border-border bg-panel p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-faint">🔥 Chủ đề đang nổi</p>

        {trending.length === 0 ? (
          <p className="mt-3 text-sm text-faint">Chưa có đủ dữ liệu để xếp hạng chủ đề.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {trending.map((topic, i) => (
              <li key={topic.tag} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-xs font-semibold text-faint">{i + 1}</span>
                <Link href={buildFilterHref(active, "tag", topic.tag)} className="min-w-0 flex-1 group">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`truncate text-sm ${
                        active.tag === topic.tag ? "font-medium text-accent" : "text-ink group-hover:text-accent"
                      }`}
                    >
                      {topic.tag}
                    </span>
                    <span className="shrink-0 text-xs text-faint">{topic.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-hot"
                      style={{ width: `${(topic.count / maxCount) * 100}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
