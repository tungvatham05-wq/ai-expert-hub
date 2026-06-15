"use client";

import { useEffect, useState } from "react";
import { BOOKMARKS_EVENT, getBookmarkIds } from "@/lib/bookmarks";

export default function SavedCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getBookmarkIds().size);
    update();
    window.addEventListener(BOOKMARKS_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(BOOKMARKS_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return <span className="text-xs text-faint">{count}</span>;
}
