import { digestItems, trendingTopics } from "@/lib/mock-data";

export default function RightSidebar() {
  const maxCount = Math.max(...trendingTopics.map((t) => t.count));

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      {/* Bản tin hôm nay */}
      <div className="rounded-2xl border border-border bg-panel p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-faint">✨ Bản tin hôm nay</p>
        </div>
        <p className="mt-1 text-xs text-faint">Thứ Năm 11 Th6, 2026 · 112 nội dung</p>

        <ul className="mt-3 space-y-3">
          {digestItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm leading-snug">
              <span className="shrink-0">{item.emoji}</span>
              <span className="text-muted">{item.text}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-canvas-2 transition-opacity hover:opacity-90"
        >
          Mở bản tin <span aria-hidden>→</span>
        </button>
      </div>

      {/* Trending topics */}
      <div className="rounded-2xl border border-border bg-panel p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-faint">🔥 Chủ đề đang nổi</p>

        <ol className="mt-3 space-y-3">
          {trendingTopics.map((topic, i) => (
            <li key={topic.tag} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-xs font-semibold text-faint">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm text-ink">{topic.tag}</span>
                  <span className="shrink-0 text-xs text-faint">{topic.count}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-hot"
                    style={{ width: `${(topic.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
