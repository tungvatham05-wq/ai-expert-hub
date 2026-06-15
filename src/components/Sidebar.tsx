import { experts, filters, sources } from "@/lib/mock-data";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
    </svg>
  );
}

const filterIcons: Record<string, string> = {
  all: "🔥",
  deep: "📚",
  saved: "🔖",
};

export default function Sidebar() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      {/* Search */}
      <label className="flex items-center gap-2 rounded-xl border border-border bg-canvas px-3 py-2.5 text-sm text-faint">
        <SearchIcon />
        <span className="flex-1 truncate">Tìm chuyên gia, chủ đề, từ khoá…</span>
        <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-faint">⌘K</kbd>
      </label>

      {/* Filters */}
      <div>
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-faint">Bộ lọc</p>
        <div className="mt-2 space-y-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                f.id === "all"
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted hover:bg-panel-hover hover:text-ink"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{filterIcons[f.id]}</span>
                {f.label}
              </span>
              <span className="text-xs text-faint">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sources */}
      <div>
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-faint">Nguồn</p>
        <div className="mt-2 space-y-1">
          {sources.map((s) => (
            <button
              key={s.id}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-panel-hover hover:text-ink"
            >
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${s.dotColor}`} />
                {s.name}
              </span>
              <span className="text-xs text-faint">{s.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Experts */}
      <div>
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-faint">Chuyên gia</p>
        <div className="mt-2 space-y-1">
          {experts.map((e) => (
            <button
              key={e.id}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-panel-hover hover:text-ink"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-panel-hover text-[11px] font-semibold text-ink">
                  {e.initials}
                </span>
                <span className="truncate">{e.name}</span>
              </span>
              <span className="shrink-0 text-xs text-faint">{e.articleCount}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
