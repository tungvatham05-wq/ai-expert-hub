-- AI Expert Hub — thêm metadata video cho nguồn YouTube.
-- Chạy 1 lần trong Supabase Studio → SQL Editor (hoặc supabase db push).
-- Các nguồn khác (Blog/Substack...) để 2 cột này NULL.

alter table public.articles
  add column if not exists thumbnail_url    text,
  add column if not exists duration_seconds integer;

comment on column public.articles.thumbnail_url    is 'Ảnh đại diện video YouTube (null với nguồn khác)';
comment on column public.articles.duration_seconds is 'Thời lượng video YouTube tính bằng giây (null với nguồn khác)';
