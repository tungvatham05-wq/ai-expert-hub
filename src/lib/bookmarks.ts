const STORAGE_KEY = "ai-expert-hub:bookmarks";
export const BOOKMARKS_EVENT = "ai-expert-hub:bookmarks-changed";

function readIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  window.dispatchEvent(new Event(BOOKMARKS_EVENT));
}

export function getBookmarkIds(): Set<string> {
  return readIds();
}

// Đăng ký lắng nghe thay đổi bookmark (cho useSyncExternalStore).
export function subscribeBookmarks(cb: () => void): () => void {
  window.addEventListener(BOOKMARKS_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(BOOKMARKS_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function isBookmarked(id: string): boolean {
  return readIds().has(id);
}

export function toggleBookmark(id: string): boolean {
  const ids = readIds();
  const next = !ids.has(id);
  if (next) {
    ids.add(id);
  } else {
    ids.delete(id);
  }
  writeIds(ids);
  return next;
}
