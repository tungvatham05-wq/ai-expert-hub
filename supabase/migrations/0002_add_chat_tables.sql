-- AI Expert Hub — Module "AI Trợ lý cá nhân" (Personal AI Chatbot).
-- Tạo 2 bảng lưu lịch sử hội thoại: chat_sessions (phiên) + chat_messages (tin nhắn).
-- Chạy 1 lần trong Supabase Studio → SQL Editor (hoặc supabase db push).

-- Bật extension tạo UUID (Supabase thường đã có sẵn, để cho chắc).
create extension if not exists pgcrypto;

-- 1) PHIÊN CHAT ---------------------------------------------------------------
create table if not exists public.chat_sessions (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null default 'Cuộc trò chuyện mới',
  -- Bài báo đang đọc khi mở chat (ngữ cảnh RAG). Null nếu chat chung, không gắn bài.
  article_id  uuid        references public.articles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table  public.chat_sessions            is 'Phiên chat của Admin với trợ lý AI';
comment on column public.chat_sessions.title      is 'Tiêu đề phiên, tự sinh từ câu hỏi đầu (gpt-4o-mini)';
comment on column public.chat_sessions.article_id is 'Bài báo gắn ngữ cảnh khi mở chat (null nếu không gắn)';
comment on column public.chat_sessions.updated_at is 'Cập nhật mỗi khi có tin nhắn mới → để sắp xếp lịch sử';

-- 2) TIN NHẮN CHI TIẾT --------------------------------------------------------
create table if not exists public.chat_messages (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        not null references public.chat_sessions(id) on delete cascade,
  role        text        not null check (role in ('user', 'assistant', 'system')),
  content     text        not null,
  created_at  timestamptz not null default now()
);

comment on table  public.chat_messages         is 'Tin nhắn chi tiết trong từng phiên chat';
comment on column public.chat_messages.role    is 'user | assistant | system (chuẩn OpenAI chat)';
comment on column public.chat_messages.session_id is 'Xoá phiên → xoá toàn bộ tin nhắn (ON DELETE CASCADE)';

-- 3) INDEX --------------------------------------------------------------------
-- Liệt kê lịch sử theo thời gian cập nhật mới nhất.
create index if not exists idx_chat_sessions_updated_at
  on public.chat_sessions (updated_at desc);
-- Tải nhanh các tin nhắn của 1 phiên theo thứ tự thời gian.
create index if not exists idx_chat_messages_session_created
  on public.chat_messages (session_id, created_at asc);

-- 4) Báo PostgREST nạp lại schema để API nhận bảng/cột mới.
notify pgrst, 'reload schema';
