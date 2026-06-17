"use client";

import { useState, type ReactNode } from "react";
import { useSearch } from "@/components/SearchProvider";
import SettingsMenu from "@/components/SettingsMenu";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l5-5 4 4 8-9M14 7h6v6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-hot text-canvas-2">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
          <path d="M12 2l1.8 4.4L18 8l-4.2 1.8L12 14l-1.8-4.2L6 8l4.2-1.6L12 2zM5 14l1 2.4L8.5 17 6 18l-1 2.5L4 18l-2.5-1L4 16.4 5 14zM18 13l1.3 3 3 1.2-3 1.3-1.3 3-1.2-3-3-1.3 3-1.2L18 13z" />
        </svg>
      </div>
      <span className="text-sm font-semibold tracking-tight text-ink sm:text-base">AI Expert Hub</span>
    </div>
  );
}

const navTabs = ["Feed", "Bản tin", "Chuyên gia"];

export default function Header({
  sidebar,
  rightSidebar,
}: {
  sidebar: ReactNode;
  rightSidebar: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState("Feed");
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const [openDrawer, setOpenDrawer] = useState<"left" | "right" | null>(null);
  const { query, setQuery } = useSearch();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 lg:gap-6 lg:px-6">
          {/* Mobile: open left drawer */}
          <button
            type="button"
            onClick={() => setOpenDrawer("left")}
            className="rounded-lg p-1.5 text-muted hover:bg-panel-hover hover:text-ink lg:hidden"
            aria-label="Mở danh mục"
          >
            <MenuIcon />
          </button>

          <Logo />

          {/* Desktop search */}
          <label className="ml-2 hidden flex-1 max-w-md items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 text-sm text-faint focus-within:border-accent/50 lg:flex">
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm chuyên gia, chủ đề, từ khoá…"
              className="flex-1 bg-transparent text-ink placeholder:text-faint focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Xóa tìm kiếm"
                className="text-faint hover:text-ink"
              >
                ✕
              </button>
            ) : (
              <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-faint">⌘K</kbd>
            )}
          </label>

          {/* Desktop nav tabs */}
          <nav className="ml-auto hidden items-center gap-1 rounded-xl border border-border bg-panel p-1 lg:flex">
            {navTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab ? "bg-panel-hover text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* VI / EN toggle */}
          <div className="ml-auto flex items-center gap-1 rounded-xl border border-border bg-panel p-1 text-xs font-semibold lg:ml-0">
            <button
              type="button"
              onClick={() => setLang("vi")}
              className={`rounded-lg px-2 py-1 transition-colors ${
                lang === "vi" ? "bg-accent text-canvas-2" : "text-faint hover:text-ink"
              }`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`rounded-lg px-2 py-1 transition-colors ${
                lang === "en" ? "bg-accent text-canvas-2" : "text-faint hover:text-ink"
              }`}
            >
              EN
            </button>
          </div>

          {/* Cài đặt (chọn giọng podcast…) */}
          <SettingsMenu />

          {/* Mobile: open right drawer (digest + trending) */}
          <button
            type="button"
            onClick={() => setOpenDrawer("right")}
            className="rounded-lg p-1.5 text-muted hover:bg-panel-hover hover:text-ink lg:hidden"
            aria-label="Mở bản tin và xu hướng"
          >
            <TrendingIcon />
          </button>
        </div>

        {/* Mobile search */}
        <div className="border-t border-border px-4 pb-3 pt-2 lg:hidden">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 text-sm text-faint focus-within:border-accent/50">
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm chuyên gia, chủ đề, từ khoá…"
              className="flex-1 bg-transparent text-ink placeholder:text-faint focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Xóa tìm kiếm"
                className="text-faint hover:text-ink"
              >
                ✕
              </button>
            )}
          </label>
        </div>
      </header>

      {/* Mobile drawers */}
      {openDrawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenDrawer(null)} />
          <div
            className={`absolute top-0 h-full w-[85%] max-w-xs overflow-y-auto bg-canvas-2 shadow-2xl ${
              openDrawer === "left" ? "left-0 border-r" : "right-0 border-l"
            } border-border`}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-ink">
                {openDrawer === "left" ? "Danh mục" : "Bản tin & Xu hướng"}
              </span>
              <button
                type="button"
                onClick={() => setOpenDrawer(null)}
                className="rounded-lg p-1 text-muted hover:bg-panel-hover hover:text-ink"
                aria-label="Đóng"
              >
                <CloseIcon />
              </button>
            </div>
            {openDrawer === "left" ? sidebar : rightSidebar}
          </div>
        </div>
      )}
    </>
  );
}
