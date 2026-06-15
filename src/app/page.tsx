import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import Feed from "@/components/Feed";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header sidebar={<Sidebar />} rightSidebar={<RightSidebar />} />

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 pb-24 pt-4 lg:px-6 lg:pb-6">
        {/* Left sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-16 h-[calc(100vh-4.5rem)] overflow-hidden rounded-2xl border border-border bg-panel">
            <Sidebar />
          </div>
        </aside>

        {/* Feed */}
        <main className="min-w-0 flex-1 py-2">
          <Feed />
        </main>

        {/* Right sidebar (large desktop) */}
        <aside className="hidden w-80 shrink-0 xl:block">
          <div className="sticky top-16 h-[calc(100vh-4.5rem)] overflow-hidden">
            <RightSidebar />
          </div>
        </aside>
      </div>

      <BottomNav />
    </div>
  );
}
