"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FeedArticle } from "@/lib/articles";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";
import Avatar from "@/components/Avatar";
import { useChat } from "@/components/ChatProvider";

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

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="15 3 21 3 21 9" />
      <line strokeLinecap="round" strokeLinejoin="round" x1="10" y1="14" x2="21" y2="3" />
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

// Nhãn thời lượng video: dưới 1 phút hiện "giây", dưới 1 giờ hiện "phút",
// còn lại hiện "giờ phút" (tránh kiểu "0 phút" với video Short).
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} phút`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

// Bắt các mốc thời gian dạng [01:25] hoặc [12:05] (và cả [1:02:11]).
const TIMESTAMP_RE = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g;

function timestampToSeconds(parts: string[]): number {
  return parts.reduce((acc, p) => acc * 60 + parseInt(p, 10), 0);
}

// Thêm tham số nhảy giây vào URL video gốc (YouTube hiểu cả ?t= lẫn &t=).
function seekUrl(videoUrl: string, seconds: number): string {
  const sep = videoUrl.includes("?") ? "&" : "?";
  return `${videoUrl}${sep}t=${seconds}s`;
}

/**
 * Hiển thị text, tự phát hiện [Phút:Giây] và biến thành link cam bấm được —
 * click sẽ mở video gốc và nhảy đến đúng giây. Khi videoUrl = null (nguồn không
 * phải YouTube) thì trả về text nguyên vẹn, không tạo link.
 */
function TimestampText({ text, videoUrl }: { text: string; videoUrl: string | null }) {
  if (!videoUrl) return <>{text}</>;

  const nodes: React.ReactNode[] = [];
  const re = new RegExp(TIMESTAMP_RE.source, "g");
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const seconds = timestampToSeconds([m[1], m[2], m[3]].filter(Boolean) as string[]);
    nodes.push(
      <a
        key={key++}
        href={seekUrl(videoUrl, seconds)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-orange-400 hover:underline"
      >
        {m[0]}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

export default function ArticleCard({ article }: { article: FeedArticle }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [lang, setLang] = useState<LangMode>("vi");
  const [expanded, setExpanded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const { openForArticle } = useChat();

  useEffect(() => {
    setBookmarked(isBookmarked(article.id));
  }, [article.id]);

  const isYouTube = article.source === "YouTube";
  // Link gốc dùng cho các mốc thời gian bấm được (chỉ bật với YouTube).
  const videoUrl = isYouTube ? article.sourceUrl : null;
  const durationLabel =
    article.durationSeconds != null ? `⏱️ ${formatDuration(article.durationSeconds)}` : null;

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

      {/* YouTube: thumbnail + thời lượng, bấm mới render iframe (tránh nặng trang khi tải) */}
      {isYouTube && (article.thumbnailUrl || article.videoId) && (
        <div className="mt-3">
          {showVideo && article.videoId ? (
            <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16 / 9" }}>
              <iframe
                src={`https://www.youtube.com/embed/${article.videoId}?autoplay=1`}
                title={article.titleVi}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              aria-label="Xem video tại chỗ"
              className="group relative block w-full overflow-hidden rounded-xl border border-border"
            >
              {article.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.thumbnailUrl}
                  alt={article.titleVi}
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 pl-1 text-xl text-white shadow-lg">
                  ▶
                </span>
              </span>
              <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                Xem video tại chỗ
              </span>
              {durationLabel && (
                <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
                  {durationLabel}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Title + body */}
      {lang === "both" ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="sm:border-r sm:border-border sm:pr-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">Tiếng Việt</p>
            <h2 className="mt-1 text-base font-semibold leading-snug text-accent sm:text-lg">
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {article.titleVi}
              </a>
            </h2>
            <ul className="mt-2 space-y-1.5">
              {article.summaryPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted">
                  <span className="mt-1 text-faint">›</span>
                  <span>
                    <TimestampText text={point} videoUrl={videoUrl} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">English</p>
            <h2 className="mt-1 text-base font-semibold leading-snug text-accent sm:text-lg">
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {article.titleOriginal}
              </a>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{article.originalSummary}</p>
          </div>
        </div>
      ) : (
        <>
          <h2 className="mt-3 text-base font-semibold leading-snug text-accent sm:text-lg">
            <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {lang === "en" ? article.titleOriginal : article.titleVi}
            </a>
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
                    <span>
                      <TimestampText text={point} videoUrl={videoUrl} />
                    </span>
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
          <TimestampText
            text={
              lang === "both" || expanded
                ? article.actionableTakeaway
                : truncateText(article.actionableTakeaway, TEXT_PREVIEW_LEN)
            }
            videoUrl={videoUrl}
          />
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

        <button
          type="button"
          onClick={() => openForArticle({ id: article.id, title: article.titleVi })}
          className="flex shrink-0 items-center gap-1 text-xs font-medium text-faint transition-colors hover:text-accent"
        >
          💬 Hỏi về bài này
        </button>

        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 text-xs text-faint transition-colors hover:text-accent"
        >
          <ExternalLinkIcon />
          Bản gốc
        </a>

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
