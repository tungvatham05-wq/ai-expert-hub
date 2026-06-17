"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, type ReactNode } from "react";
import type { PodcastVoice } from "@/lib/podcast";

interface SettingsContextValue {
  podcastVoice: PodcastVoice;
  setPodcastVoice: (voice: PodcastVoice) => void;
}

const STORAGE_KEY = "aeh:podcast-voice";
const VOICE_EVENT = "aeh:podcast-voice-changed";
const DEFAULT_VOICE: PodcastVoice = "female";

// Đọc giọng đã lưu (an toàn SSR). Dùng làm getSnapshot cho useSyncExternalStore.
function readVoice(): PodcastVoice {
  if (typeof window === "undefined") return DEFAULT_VOICE;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "male" || v === "female" ? v : DEFAULT_VOICE;
}

// Lắng nghe thay đổi (cùng tab qua custom event; tab khác qua "storage").
function subscribe(cb: () => void): () => void {
  window.addEventListener(VOICE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(VOICE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const SettingsContext = createContext<SettingsContextValue>({
  podcastVoice: DEFAULT_VOICE,
  setPodcastVoice: () => {},
});

// Cài đặt phía client lưu vào localStorage (không cần DB). Hiện có: giọng đọc podcast.
export function SettingsProvider({ children }: { children: ReactNode }) {
  // useSyncExternalStore: tránh setState-trong-effect và không lệch SSR/hydration.
  const podcastVoice = useSyncExternalStore(subscribe, readVoice, () => DEFAULT_VOICE);

  const setPodcastVoice = useCallback((voice: PodcastVoice) => {
    window.localStorage.setItem(STORAGE_KEY, voice);
    window.dispatchEvent(new Event(VOICE_EVENT));
  }, []);

  return (
    <SettingsContext.Provider value={{ podcastVoice, setPodcastVoice }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
