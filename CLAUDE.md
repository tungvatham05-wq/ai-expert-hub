@AGENTS.md

# AI Expert Hub — Bàn giao kiến trúc

Next.js + Supabase: cào RSS của chuyên gia AI → biên tập/dịch sang tiếng Việt bằng LLM → hiển thị feed. Deploy trên Vercel.

## Luồng xử lý (cron sync)
`src/app/api/cron/sync/route.ts` (chạy hằng ngày qua `vercel.json`, bảo vệ bằng `CRON_SECRET`):
1. Đọc nguồn từ bảng `expert_sources` (active) — thêm/bớt chuyên gia = sửa DB, **không sửa code**.
2. `fetchFeed()` (`src/lib/sources.ts`) đọc RSS/Atom (Substack, Blog, YouTube channel feed, X qua RSSHub).
3. Lọc 2 lớp giữ trọng tâm AI: `isAiRelated()` (từ khoá, `src/lib/prefilter.ts`) → LLM tự gắn cờ `should_skip` nếu không liên quan AI/tech.
4. **Định tuyến model theo nền tảng** (suy ra từ URL, KHÔNG lưu DB):
   - YouTube → OpenAI `gpt-4o-mini` (`src/lib/openai.ts`), tóm tắt theo mốc `[Phút:Giây]`.
   - Blog/Substack/khác → Claude Haiku (`src/lib/anthropic.ts`).
5. Lưu vào bảng `articles` + liên kết `tags` / `ai_tools`.

## Định tuyến & "nguồn tin"
- `detectPlatform(url)` trong `src/lib/platform.ts` là **nguồn sự thật duy nhất** cho cả routing backend lẫn badge frontend. "Substack" gom vào "Blog".
- Pipeline YouTube dùng chung: `analyzeYouTubeItem()` trong `src/lib/youtube.ts` (cron route và các script đều gọi). Quy tắc "thắt lưng buộc bụng": ưu tiên timeline tác giả trong mô tả → nếu không có và video <20 phút mới tải transcript → cuối cùng mới dùng mô tả.
- Helper YouTube thuần (`extractVideoId`, `watchUrl`) ở `platform.ts` để frontend dùng mà KHÔNG kéo `youtube-transcript` (lib backend) vào bundle.

## DB (Supabase, project ref nằm trong `SUPABASE_URL`)
- Bảng chính: `experts`, `expert_sources` (có cột `platform` NOT NULL), `articles`, `tags`, `ai_tools` + bảng nối.
- `articles` có `thumbnail_url`, `duration_seconds` (chỉ YouTube; nguồn khác để null).
- Migration SQL: `supabase/migrations/`. Không có DB password local → chạy DDL qua **Supabase Management API** (cần Personal Access Token, hỏi user). Sau `ALTER TABLE` nhớ `notify pgrst, 'reload schema'` để PostgREST nhận cột mới.

## Frontend
- `src/lib/articles.ts`: đọc DB → `FeedArticle`. Avatar fallback về initials nếu `avatar_url` null.
- `src/components/ArticleCard.tsx`: card YouTube có thumbnail + nhãn thời lượng, lazy `<iframe>` ("Xem video tại chỗ"), và regex biến `[MM:SS]` thành link cam nhảy đúng giây (`&t=Ns`).
- `next.config.ts` `images.remotePatterns`: phải allowlist host avatar (github, wikimedia, twimg, `yt3.ggpht.com`...). Thêm nguồn ảnh mới = thêm host ở đây, **cần redeploy**.

## Script tiện ích (`npx tsx --env-file=.env.local scripts/<x>.ts`)
- `sync-youtube-test.ts` — sync thử chỉ các kênh YouTube.
- `backfill-youtube-meta.ts` — điền duration/thumbnail cho video cũ.
- `add-3b1b-foundations.ts` — thêm tay video evergreen (cũ hơn cửa sổ RSS); luôn tải transcript. Sửa `EXPERT_NAME` + `VIDEO_IDS` để tái dùng.
- `set-avatars.ts` — điền avatar còn thiếu (YouTube qua Data API, người khác qua Wikipedia pageimages).

## Env vars (`.env.local`, đã gitignore — `.env.local.example` là mẫu)
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (YouTube), `YOUTUBE_API_KEY` (thời lượng + gate transcript; thiếu thì degrade graceful), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, (tuỳ chọn `RSSHUB_URL`). Phải khai báo cả trên Vercel.

## Deploy
- Vercel nối GitHub `master` → push là tự deploy. **Đổi code/config phải push + deploy**; còn thêm nguồn/video/avatar chỉ là **data trong Supabase dùng chung → hiện ngay trên production, không cần deploy**.
- Verify nhanh sau deploy: `curl -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/cron/sync` → `{"ok":true, errors:[]}`.

## Lưu ý vận hành
- RSS chỉ trả ~15 mục mới nhất/kênh → video kinh điển cũ phải thêm tay (xem `add-3b1b-foundations.ts`).
- Mỗi lần cron lấy tối đa 5 mục/nguồn (`MAX_ITEMS_PER_SOURCE`).
- Nền tảng cố ý GIỮ TRỌNG TÂM AI: nội dung ngoài AI/tech bị lọc bỏ. Muốn mở sang chủ đề khác cần sửa prefilter + prompt (gắn category cho nguồn).
