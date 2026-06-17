"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import type { PodcastVoice } from "@/lib/podcast";

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.61.79 1 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      />
    </svg>
  );
}

const VOICE_OPTIONS: { value: PodcastVoice; label: string }[] = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
];

// Menu cài đặt (bánh răng) ở Header. Hiện có: chọn giọng đọc podcast (lưu localStorage).
export default function SettingsMenu() {
  const { podcastVoice, setPodcastVoice } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Bấm ra ngoài → đóng menu.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Cài đặt"
        aria-expanded={open}
        className={`rounded-lg p-1.5 transition-colors hover:bg-panel-hover hover:text-ink ${
          open ? "text-ink" : "text-muted"
        }`}
      >
        <GearIcon />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-60 rounded-xl border border-border bg-panel p-3 shadow-2xl">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-faint">Cài đặt</p>

          <div className="mt-3">
            <p className="flex items-center gap-1.5 px-1 text-sm font-medium text-ink">
              🎧 Giọng đọc podcast
            </p>
            <div className="mt-2 flex gap-1 rounded-lg border border-border bg-canvas p-1">
              {VOICE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPodcastVoice(opt.value)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                    podcastVoice === opt.value ? "bg-accent text-canvas-2" : "text-muted hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 px-1 text-[11px] leading-relaxed text-faint">
              Áp dụng cho mọi bài. Đổi giọng sẽ tạo bản đọc mới ở lần nghe kế tiếp.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
