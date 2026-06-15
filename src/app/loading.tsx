function Pulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-panel-hover ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-panel p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Pulse className="h-9 w-9 shrink-0" />
        <div className="flex-1 space-y-2">
          <Pulse className="h-3 w-40 rounded-md" />
          <Pulse className="h-2.5 w-24 rounded-md" />
        </div>
      </div>
      <Pulse className="mt-4 h-4 w-3/4 rounded-md" />
      <div className="mt-3 space-y-2">
        <Pulse className="h-3 w-full rounded-md" />
        <Pulse className="h-3 w-full rounded-md" />
        <Pulse className="h-3 w-2/3 rounded-md" />
      </div>
      <Pulse className="mt-4 h-16 w-full rounded-xl" />
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden p-4">
      <Pulse className="h-10 w-full rounded-xl" />
      <div className="space-y-2">
        <Pulse className="h-2.5 w-16 rounded-md" />
        <Pulse className="h-8 w-full rounded-lg" />
        <Pulse className="h-8 w-full rounded-lg" />
        <Pulse className="h-8 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <Pulse className="h-2.5 w-16 rounded-md" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Pulse key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-border bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 lg:gap-6 lg:px-6">
          <Pulse className="h-8 w-8 rounded-xl" />
          <Pulse className="h-4 w-28 rounded-md" />
          <Pulse className="ml-auto h-8 w-20 rounded-xl" />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 pb-24 pt-4 lg:px-6 lg:pb-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-16 h-[calc(100vh-4.5rem)] overflow-hidden rounded-2xl border border-border bg-panel">
            <SidebarSkeleton />
          </div>
        </aside>

        <main className="min-w-0 flex-1 py-2">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Pulse className="h-6 w-32 rounded-md" />
              <Pulse className="h-3 w-40 rounded-md" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </main>

        <aside className="hidden w-80 shrink-0 xl:block">
          <div className="sticky top-16 h-[calc(100vh-4.5rem)] overflow-hidden">
            <div className="rounded-2xl border border-border bg-panel p-4">
              <Pulse className="h-2.5 w-32 rounded-md" />
              <Pulse className="mt-3 h-3 w-48 rounded-md" />
              <div className="mt-4 space-y-3">
                <Pulse className="h-3 w-full rounded-md" />
                <Pulse className="h-3 w-2/3 rounded-md" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
