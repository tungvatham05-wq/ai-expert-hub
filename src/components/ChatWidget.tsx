"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import { useChat, type PendingArticle } from "@/components/ChatProvider";

// ====== Kiểu dữ liệu khớp với API Bước 2 ======
interface ChatSession {
  id: string;
  title: string;
  article_id: string | null;
  created_at: string;
  updated_at: string;
}
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

const PW_KEY = "aih_admin_chat_pw"; // lưu mật khẩu Admin ở localStorage để khỏi nhập lại

// ====== Icons (đồng bộ phong cách stroke 1.8 như Header) ======
const I = {
  chat: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.2A8 8 0 1121 12z" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8m0-5v5h5M12 7v5l3 2" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l15-7-7 15-2-6-6-2z" />
    </svg>
  ),
};

export default function ChatWidget() {
  const { open, setOpen, pending, clearPending } = useChat();
  const [authed, setAuthed] = useState(false);
  // Bài đang được "ghim" vào cuộc trò chuyện mới hiện tại (ngữ cảnh RAG).
  const [boundArticle, setBoundArticle] = useState<PendingArticle | null>(null);
  // Lazy init từ localStorage (chỉ chạy ở client) — tránh setState trong effect.
  const [password, setPassword] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem(PW_KEY) ?? "" : ""
  );
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");

  const [view, setView] = useState<"chat" | "history">("chat");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // fetch helper: tự gắn header mật khẩu Admin
  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      const res = await fetch(path, {
        ...init,
        headers: {
          "content-type": "application/json",
          "x-admin-password": password,
          ...(init?.headers ?? {}),
        },
      });
      return res;
    },
    [password]
  );

  const loadSessions = useCallback(async () => {
    const res = await api("/api/chat/sessions");
    if (res.ok) {
      const data = await res.json();
      setSessions(data.sessions ?? []);
    }
  }, [api]);

  // Khi đã có password (từ localStorage) và mở panel → tự xác thực
  useEffect(() => {
    if (!open || authed || !password) return;
    (async () => {
      const res = await api("/api/chat/auth", { method: "POST" });
      if (res.ok) {
        setAuthed(true);
        loadSessions();
      } else {
        localStorage.removeItem(PW_KEY);
        setPassword("");
      }
    })();
  }, [open, authed, password, api, loadSessions]);

  // Tự cuộn xuống cuối khi có tin mới
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Khi card bấm "Hỏi về bài này": bắt đầu cuộc trò chuyện mới GHIM bài đó.
  // clearPending() ngay sau khi nhận → effect không chạy lại (pending về null).
  useEffect(() => {
    if (!pending) return;
    setBoundArticle(pending.article);
    setCurrentId(null);
    setMessages([]);
    setView("chat");
    clearPending();
  }, [pending, clearPending]);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    const res = await fetch("/api/chat/auth", {
      method: "POST",
      headers: { "x-admin-password": pwInput },
    });
    if (res.ok) {
      localStorage.setItem(PW_KEY, pwInput);
      setPassword(pwInput);
      setAuthed(true);
      setPwInput("");
      loadSessions();
    } else {
      setPwError("Mật khẩu không đúng.");
    }
  }

  function newChat() {
    setBoundArticle(null);
    setCurrentId(null);
    setMessages([]);
    setView("chat");
  }

  async function openSession(id: string) {
    setBoundArticle(null); // phiên cũ đã lưu ngữ cảnh ở DB; không ghim lại ở UI
    setCurrentId(id);
    setView("chat");
    setLoadingMsgs(true);
    const res = await api(`/api/chat/sessions/${id}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
    }
    setLoadingMsgs(false);
  }

  async function deleteSession(id: string) {
    if (!confirm("Xoá cuộc trò chuyện này?")) return;
    await api(`/api/chat/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentId === id) newChat();
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    // Tạo phiên nếu chưa có (lần gửi đầu của "New Chat")
    let sessionId = currentId;
    if (!sessionId) {
      const res = await api("/api/chat/sessions", {
        method: "POST",
        body: JSON.stringify(boundArticle ? { article_id: boundArticle.id } : {}),
      });
      if (!res.ok) {
        setSending(false);
        setInput(text);
        return;
      }
      sessionId = (await res.json()).session.id as string;
      setCurrentId(sessionId);
    }

    // Hiển thị lạc quan tin nhắn của user
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const res = await api(`/api/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: text }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        data.userMessage,
        data.assistantMessage,
      ]);
      loadSessions(); // cập nhật tiêu đề + thứ tự lịch sử
    } else {
      // lỗi → khôi phục ô nhập, gỡ tin lạc quan
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
    }
    setSending(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Nút mở (floating, góc phải dưới) — nằm trên BottomNav ở mobile */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở trợ lý AI"
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-hot text-canvas-2 shadow-lg transition-transform hover:scale-105 lg:bottom-6 lg:right-6"
        >
          {I.chat}
        </button>
      )}

      {/* Slide-over */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-canvas shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-hot text-canvas-2">
                  {I.chat}
                </span>
                <span className="text-sm font-semibold text-ink">Trợ lý AI</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="rounded-lg p-1 text-muted hover:bg-panel-hover hover:text-ink"
              >
                {I.close}
              </button>
            </div>

            {!authed ? (
              // ====== Màn hình nhập mật khẩu ======
              <form onSubmit={submitPassword} className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-panel text-accent">
                  {I.chat}
                </span>
                <p className="text-sm text-muted">Khu vực dành riêng cho Admin.<br />Nhập mật khẩu để mở trợ lý.</p>
                <input
                  type="password"
                  value={pwInput}
                  onChange={(e) => setPwInput(e.target.value)}
                  placeholder="Mật khẩu Admin"
                  autoFocus
                  className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-accent/50 focus:outline-none"
                />
                {pwError && <p className="text-xs text-hot">{pwError}</p>}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-br from-accent to-hot px-4 py-2 text-sm font-semibold text-canvas-2 hover:opacity-90"
                >
                  Mở khoá
                </button>
              </form>
            ) : (
              <>
                {/* Thanh công cụ: New Chat + chuyển Chat/Lịch sử */}
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                  <button
                    type="button"
                    onClick={newChat}
                    className="flex items-center gap-1.5 rounded-lg bg-panel px-3 py-1.5 text-xs font-medium text-ink hover:bg-panel-hover"
                  >
                    {I.plus} Cuộc trò chuyện mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setView(view === "history" ? "chat" : "history")}
                    className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:bg-panel-hover hover:text-ink"
                  >
                    {view === "history" ? I.back : I.history}
                    {view === "history" ? "Quay lại chat" : "Lịch sử"}
                  </button>
                </div>

                {view === "history" ? (
                  // ====== Danh sách lịch sử ======
                  <div className="flex-1 overflow-y-auto p-3">
                    {sessions.length === 0 ? (
                      <p className="mt-8 text-center text-sm text-faint">Chưa có cuộc trò chuyện nào.</p>
                    ) : (
                      <ul className="space-y-1">
                        {sessions.map((s) => (
                          <li key={s.id} className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-panel">
                            <button
                              type="button"
                              onClick={() => openSession(s.id)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <span className="block truncate text-sm text-ink">{s.title}</span>
                              <span className="block text-[11px] text-faint">
                                {new Date(s.updated_at).toLocaleString("vi-VN")}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSession(s.id)}
                              aria-label="Xoá"
                              className="rounded p-1 text-faint opacity-0 hover:text-hot group-hover:opacity-100"
                            >
                              {I.trash}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  // ====== Khung chat ======
                  <>
                    {/* Banner bài đang ghim (ngữ cảnh RAG) */}
                    {boundArticle && (
                      <div className="flex items-center gap-2 border-b border-border bg-accent-soft px-3 py-2">
                        <span className="shrink-0 text-accent">📄</span>
                        <span className="min-w-0 flex-1 truncate text-xs text-ink">
                          Đang hỏi về: <span className="font-medium">{boundArticle.title}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setBoundArticle(null)}
                          aria-label="Bỏ ghim bài"
                          className="shrink-0 rounded p-0.5 text-faint hover:text-ink"
                        >
                          {I.close}
                        </button>
                      </div>
                    )}
                    <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
                      {loadingMsgs ? (
                        <p className="text-center text-sm text-faint">Đang tải…</p>
                      ) : messages.length === 0 ? (
                        <div className="mt-10 text-center">
                          {boundArticle ? (
                            <p className="text-sm text-muted">Hỏi bất cứ điều gì về bài viết này.</p>
                          ) : (
                            <>
                              <p className="text-sm text-muted">Hỏi tôi về thuật ngữ, bối cảnh hay ý nghĩa</p>
                              <p className="text-sm text-muted">của bất kỳ bài viết nào trên Hub.</p>
                            </>
                          )}
                        </div>
                      ) : (
                        messages.map((m) => (
                          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                            <div
                              className={
                                m.role === "user"
                                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent-soft px-3.5 py-2 text-sm text-ink"
                                  : "max-w-[90%] rounded-2xl rounded-bl-sm bg-panel px-3.5 py-2 text-ink"
                              }
                            >
                              {m.role === "user" ? (
                                <span className="whitespace-pre-wrap">{m.content}</span>
                              ) : (
                                <Markdown content={m.content} />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      {sending && (
                        <div className="flex justify-start">
                          <div className="rounded-2xl rounded-bl-sm bg-panel px-3.5 py-2 text-sm text-faint">
                            Đang soạn…
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ô nhập */}
                    <div className="border-t border-border p-3">
                      <div className="flex items-end gap-2 rounded-xl border border-border bg-panel px-3 py-2 focus-within:border-accent/50">
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={onKeyDown}
                          rows={1}
                          placeholder="Nhập câu hỏi… (Enter để gửi)"
                          className="max-h-32 flex-1 resize-none bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={send}
                          disabled={!input.trim() || sending}
                          aria-label="Gửi"
                          className="shrink-0 rounded-lg p-1.5 text-accent hover:bg-panel-hover disabled:opacity-40"
                        >
                          {I.send}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
