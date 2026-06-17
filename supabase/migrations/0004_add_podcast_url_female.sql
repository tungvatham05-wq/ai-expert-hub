-- AI Expert Hub — Podcast: thêm giọng nữ (voice thứ 2).
-- Mỗi giọng cache riêng 1 file + 1 cột URL:
--   podcast_url        = giọng nam  (file `${articleId}.mp3`)
--   podcast_url_female = giọng nữ   (file `${articleId}-female.mp3`)
-- Chạy 1 lần qua Supabase Management API (hoặc SQL Editor).

alter table public.articles
  add column if not exists podcast_url_female text;

comment on column public.articles.podcast_url_female is
  'URL công khai file mp3 podcast GIỌNG NỮ đã sinh & cache (bucket `podcasts`). Null nếu chưa sinh.';

-- Báo PostgREST nạp lại schema để API nhận cột mới.
notify pgrst, 'reload schema';
