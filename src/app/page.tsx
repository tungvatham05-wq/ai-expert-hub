import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import Feed from "@/components/Feed";
import BottomNav from "@/components/BottomNav";
import {
  getAllArticles,
  filterArticles,
  getDeepDiveCount,
  getExpertCounts,
  getSourceCounts,
  getTodayDigest,
  getTrendingTags,
  type FeedFilterParams,
} from "@/lib/articles";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<FeedFilterParams>;
}) {
  const activeFilters = await searchParams;
  const allArticles = await getAllArticles();
  const articles = filterArticles(allArticles, activeFilters);

  const experts = getExpertCounts(allArticles);
  const sources = getSourceCounts(allArticles);
  const trending = getTrendingTags(allArticles);
  const digest = getTodayDigest(allArticles);
  const deepCount = getDeepDiveCount(allArticles);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header
        sidebar={
          <Sidebar
            experts={experts}
            sources={sources}
            total={allArticles.length}
            deepCount={deepCount}
            active={activeFilters}
          />
        }
        rightSidebar={<RightSidebar digest={digest} trending={trending} active={activeFilters} />}
      />

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 pb-24 pt-4 lg:px-6 lg:pb-6">
        {/* Left sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-16 h-[calc(100vh-4.5rem)] overflow-hidden rounded-2xl border border-border bg-panel">
            <Sidebar
              experts={experts}
              sources={sources}
              total={allArticles.length}
              deepCount={deepCount}
              active={activeFilters}
            />
          </div>
        </aside>

        {/* Feed */}
        <main className="min-w-0 flex-1 py-2">
          <Feed articles={articles} total={allArticles.length} active={activeFilters} />
        </main>

        {/* Right sidebar (large desktop) */}
        <aside className="hidden w-80 shrink-0 xl:block">
          <div className="sticky top-16 h-[calc(100vh-4.5rem)] overflow-hidden">
            <RightSidebar digest={digest} trending={trending} active={activeFilters} />
          </div>
        </aside>
      </div>

      <BottomNav />
    </div>
  );
}
