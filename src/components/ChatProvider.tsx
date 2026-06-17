"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

// Bài viết được "ghim" vào một cuộc trò chuyện mới để hỏi đáp theo ngữ cảnh (RAG).
export interface PendingArticle {
  id: string;
  title: string;
}

interface ChatContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  // Bài đang chờ mở chat (do bấm "Hỏi về bài này" trên card). Tăng nonce để
  // ChatWidget biết có YÊU CẦU MỚI ngay cả khi cùng một bài được bấm lại.
  pending: { article: PendingArticle; nonce: number } | null;
  openForArticle: (article: PendingArticle) => void;
  clearPending: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat phải nằm trong <ChatProvider>");
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<ChatContextValue["pending"]>(null);

  const openForArticle = useCallback((article: PendingArticle) => {
    setPending({ article, nonce: Date.now() });
    setOpen(true);
  }, []);

  const clearPending = useCallback(() => setPending(null), []);

  return (
    <ChatContext.Provider value={{ open, setOpen, pending, openForArticle, clearPending }}>
      {children}
    </ChatContext.Provider>
  );
}
