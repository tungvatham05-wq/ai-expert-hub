"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FeedArticle } from "@/lib/articles";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";
import Avatar from "@/components/Avatar";

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z"
      />
    </svg>
  );
}

function LanguageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h7M7.5 3v2m0 0c0 4-3 7-5.5 7M8 8c1.2 2.5 3 4 5.5 5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 21l4-9 4 9M14.5 18h5" />
    </svg>
  );
}

const sourceBadgeClasses: Record<FeedArticle["source"], string> = {
  X: "bg-panel-hover text-ink",
  Bluesky: "bg-sky-400/15 text-sky-300",
  Blog: "bg-emerald-400/15 text-emerald-300",
  YouTube: "bg-red-500/15 text-red-300",
  arXiv: "bg-violet-400/15 text-violet-300",
  GitHub: "bg-slate-300/15 text-slate-200",
  "HF Papers": "bg-yellow-400/15 text-yellow-300",
};

type LangMode = "vi" | "en" | "both";

const LANG_OPTIONS: { value: LangMode; label: string }[] = [
  { value: "vi", label: "VI" },
  { value: "en", label: "EN" },
  { value: "both", label: "Cả hai" },
];

const SUMMARY_PREVIEW_COUNT = 3;
const TEXT_PREVIEW_LEN = 240;

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

export default function ArticleCard({ article }: { article: FeedArticle }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [lang, setLang] = useState<LangMode>("vi");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(article.id));
  }, [article.id]);

  const isLong =
    lang === "vi"
      ? article.summaryPoints.length > SUMMARY_PREVIEW_COUNT || article.actionableTakeaway.length > TEXT_PREVIEW_LEN
      : lang === "en"
        ? article.originalSummary.length > TEXT_PREVIEW_LEN || article.actionableTakeaway.length > TEXT_PREVIEW_LEN
        : false;

  return (
    <article className="rounded-2xl border border-border bg-panel p-4 transition-colors hover:border-faint/40 sm:p-5">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Avatar
          src={article.avatarUrl}
          alt={article.expertName}
          initials={article.expertInitials}
          size={36}
          textClassName="text-xs"
        />

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-medium text-ink">{article.expertName}</span>
          <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${sourceBadgeClasses[article.source]}`}>
            {article.source}
          </span>
          <span className="flex items-center gap-1 text-faint">
            <span className="h-1 w-1 rounded-full bg-faint" />
            {article.sourceLabel}
          </span>
          <span className="text-faint">· {article.time}</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {article.isNew && (
            <span className="rounded-md border border-accent/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
              Mới
            </span>
          )}
          {article.isHot && (
            <span className="rounded-md bg-hot-soft px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-hot">
              🔥 Hot
            </span>
          )}
          <button
            type="button"
            aria-label={bookmarked ? "Bỏ lưu bài viết" : "Lưu bài viết"}
            onClick={() => setBookmarked(toggleBookmark(article.id))}
            className={`transition-colors ${bookmarked ? "text-accent" : "text-faint hover:text-ink"}`}
          >
            <BookmarkIcon filled={bookmarked} />
          </button>
        </div>
      </div>

      {/* Title + body */}
      {lang === "both" ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="sm:border-r sm:border-border sm:pr-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">Tiếng Việt</p>
            <h2 className="mt-1 text-base font-semibold leading-snug text-accent sm:text-lg">{article.titleVi}</h2>
            <ul className="mt-2 space-y-1.5">
              {article.summaryPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted">
                  <span className="mt-1 text-faint">›</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">English</p>
            <h2 className="mt-1 text-base font-semibold leading-snug text-accent sm:text-lg">
              {article.titleOriginal}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{article.originalSummary}</p>
          </div>
        </div>
      ) : (
        <>
          <h2 className="mt-3 text-base font-semibold leading-snug text-accent sm:text-lg">
            {lang === "en" ? article.titleOriginal : article.titleVi}
          </h2>
          {lang === "en" ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {expanded ? article.originalSummary : truncateText(article.originalSummary, TEXT_PREVIEW_LEN)}
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {(expanded ? article.summaryPoints : article.summaryPoints.slice(0, SUMMARY_PREVIEW_COUNT)).map(
                (point, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted">
                    <span className="mt-1 text-faint">›</span>
                    <span>{point}</span>
                  </li>
                )
              )}
            </ul>
          )}
        </>
      )}

      {/* Actionable takeaway */}
      <div className="mt-3 rounded-xl border border-accent/20 bg-accent-soft p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">💡 Ứng dụng thực tế</p>
        <p className="mt-1 text-sm leading-relaxed text-ink/90">
          {lang === "both" || expanded
            ? article.actionableTakeaway
            : truncateText(article.actionableTakeaway, TEXT_PREVIEW_LEN)}
        </p>
      </div>

      {/* Expand/collapse long content */}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-accent hover:underline"
        >
          {expanded ? "Thu gọn ↑" : "Xem thêm ↓"}
        </button>
      )}

      {/* AI tools */}
      {article.aiTools.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {article.aiTools.map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-border bg-canvas px-2.5 py-1 text-xs text-muted"
            >
              🛠️ {tool}
            </span>
          ))}
        </div>
      )}

      {/* Footer: tags + actions */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <Link
              key={tag}
              href={`/?tag=${encodeURIComponent(tag)}`}
              className="rounded-full px-2 py-1 text-xs text-faint transition-colors hover:bg-panel-hover hover:text-accent"
            >
              {tag}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full border border-border p-1 text-xs font-medium text-muted">
          <LanguageIcon />
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLang(opt.value)}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                lang === opt.value ? "bg-accent text-canvas-2" : "hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
