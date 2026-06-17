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
- Chatbot: `chat_sessions` + `chat_messages` (xem mục "Chatbot trợ lý cá nhân").
- Migration SQL: `supabase/migrations/`. Không có DB password local → chạy DDL qua **Supabase Management API** (cần Personal Access Token, hỏi user). Sau `ALTER TABLE` nhớ `notify pgrst, 'reload schema'` để PostgREST nhận cột mới.

## Frontend
- `src/lib/articles.ts`: đọc DB → `FeedArticle`. Avatar fallback về initials nếu `avatar_url` null.
- `src/components/ArticleCard.tsx`: card YouTube layout **compact 2 cột** (chữ 70% / thumbnail nhỏ 30%, mobile xếp dọc ảnh cao tối đa 160px). State `isPlaying`: bấm thumbnail → phát inline bằng `<iframe>` full-width `aspect-video` lên trên (1 cột), `autoplay=1`. Regex biến `[MM:SS]` thành link cam nhảy đúng giây (`&t=Ns`). Có nút "💬 Hỏi về bài này" → mở chatbot ghim bài (qua `ChatProvider`).
- `next.config.ts` `images.remotePatterns`: phải allowlist host avatar (github, wikimedia, twimg, `yt3.ggpht.com`...). Thêm nguồn ảnh mới = thêm host ở đây, **cần redeploy**.
- Ô tìm kiếm: **chỉ ở Header** (`Header.tsx`). Sidebar trái KHÔNG còn ô search (đã gỡ để tránh trùng).

## Chatbot trợ lý cá nhân (chỉ Admin)
Sidebar trượt từ phải để Admin hỏi đáp về bài đang đọc mà không rời trang. Tái dùng `OPENAI_API_KEY` + `gpt-4o-mini` (KHÔNG tạo key mới).
- **Bảo vệ:** mọi `/api/chat/*` gác bằng `ADMIN_CHAT_PASSWORD` qua header `x-admin-password` (`src/lib/chat-auth.ts`, so sánh hằng-thời-gian). KHÔNG bật RLS — toàn bộ DB đi qua route handler (service role).
- **DB:** `chat_sessions` (cột `article_id` nullable → ngữ cảnh RAG) + `chat_messages` (`on delete cascade` khi xoá phiên). Migration `0002_add_chat_tables.sql`.
- **API** (`src/app/api/chat/`): `auth` (verify mật khẩu); `sessions` (GET list / POST tạo, nhận `article_id`); `sessions/[id]` (DELETE / PATCH đổi tên); `sessions/[id]/messages` (GET / POST gửi). POST tin **đầu tiên** tự đặt tên phiên bằng `gpt-4o-mini`. Lưu ý Next 16: params route động là `Promise` → `await ctx.params`.
- **LLM helper** `src/lib/chat.ts`: `generateChatReply()` (system prompt + ghép `original_content` của bài nếu phiên có `article_id`) và `generateSessionTitle()`.
- **UI:** `ChatWidget.tsx` (slide-over: New Chat, Lịch sử, xoá phiên, màn nhập mật khẩu — lưu `localStorage`), `Markdown.tsx` (renderer tự viết, 0 dependency, an toàn XSS), `ChatProvider.tsx` (context; `ArticleCard` gọi `openForArticle({id,title})` để mở chat ghim bài).

## Script tiện ích (`npx tsx --env-file=.env.local scripts/<x>.ts`)
- `sync-youtube-test.ts` — sync thử chỉ các kênh YouTube.
- `backfill-youtube-meta.ts` — điền duration/thumbnail cho video cũ.
- `add-3b1b-foundations.ts` — thêm tay video evergreen (cũ hơn cửa sổ RSS); luôn tải transcript. Sửa `EXPERT_NAME` + `VIDEO_IDS` để tái dùng.
- `set-avatars.ts` — điền avatar còn thiếu (YouTube qua Data API, người khác qua Wikipedia pageimages).

## Env vars (`.env.local`, đã gitignore — `.env.local.example` là mẫu)
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (YouTube + chatbot), `YOUTUBE_API_KEY` (thời lượng + gate transcript; thiếu thì degrade graceful), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `ADMIN_CHAT_PASSWORD` (gác chatbot; thiếu → chatbot khoá toàn bộ), (tuỳ chọn `RSSHUB_URL`). Phải khai báo cả trên Vercel.

## Deploy
- Vercel nối GitHub `master` → push là tự deploy. **Đổi code/config phải push + deploy**; còn thêm nguồn/video/avatar chỉ là **data trong Supabase dùng chung → hiện ngay trên production, không cần deploy**.
- Verify nhanh sau deploy: `curl -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/cron/sync` → `{"ok":true, errors:[]}`.

## Lưu ý vận hành
- RSS chỉ trả ~15 mục mới nhất/kênh → video kinh điển cũ phải thêm tay (xem `add-3b1b-foundations.ts`).
- Mỗi lần cron lấy tối đa 5 mục/nguồn (`MAX_ITEMS_PER_SOURCE`).
- Nền tảng cố ý GIỮ TRỌNG TÂM AI: nội dung ngoài AI/tech bị lọc bỏ. Muốn mở sang chủ đề khác cần sửa prefilter + prompt (gắn category cho nguồn).
