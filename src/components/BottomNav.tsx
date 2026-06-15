function FeedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
    </svg>
  );
}

function DigestIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h12v14l-4-2-4 2V5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 5h4v14l-4-2" />
    </svg>
  );
}

function ExpertsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="9" cy="8" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20c0-3 2.7-5 6-5s6 2 6 5M15 13c2.8.3 5 2.2 5 5" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z" />
    </svg>
  );
}

const items = [
  { label: "Feed", icon: FeedIcon, active: true },
  { label: "Bản tin", icon: DigestIcon, active: false },
  { label: "Chuyên gia", icon: ExpertsIcon, active: false },
  { label: "Đã lưu", icon: BookmarkIcon, active: false },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-canvas-2/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-2 py-2">
        {items.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            type="button"
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
              active ? "text-accent" : "text-faint hover:text-ink"
            }`}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
