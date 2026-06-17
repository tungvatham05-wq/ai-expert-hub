-- AI Expert Hub — Module "Podcast" (nghe bài báo dạng audio, 1 người dẫn).
-- Thêm cột cache URL file mp3 đã sinh cho mỗi bài (kiến trúc lazy generate + cache):
--   lần đầu gọi /api/podcast/[articleId] mới sinh audio → upload Supabase Storage
--   (bucket `podcasts`, public) → lưu URL công khai vào cột này. Lần sau trả thẳng URL.
-- Chạy 1 lần trong Supabase Studio → SQL Editor (hoặc qua Supabase Management API).

alter table public.articles
  add column if not exists podcast_url text;

comment on column public.articles.podcast_url is
  'URL công khai file mp3 podcast đã sinh & cache (bucket Storage `podcasts`). Null nếu chưa sinh.';

-- Báo PostgREST nạp lại schema để API nhận cột mới.
notify pgrst, 'reload schema';
