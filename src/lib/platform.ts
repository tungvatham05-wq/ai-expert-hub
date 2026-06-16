// Nhận diện "nguồn tin" (source platform) từ URL bài viết.
// Đây là NGUỒN SỰ THẬT DUY NHẤT cho việc định tuyến model ở backend
// (YouTube → OpenAI, còn lại → Anthropic) và hiển thị badge ở frontend.
// Lưu ý: trong dự án này "Substack" được gom chung vào "Blog" vì cùng là RSS bài viết.

export type SourcePlatform = "X" | "Bluesky" | "Blog" | "YouTube" | "arXiv" | "GitHub" | "HF Papers";

export function detectPlatform(url: string): SourcePlatform {
  if (/github\.com/i.test(url)) return "GitHub";
  if (/(?:twitter|x)\.com/i.test(url)) return "X";
  if (/bsky\.app/i.test(url)) return "Bluesky";
  if (/youtube\.com|youtu\.be/i.test(url)) return "YouTube";
  if (/arxiv\.org/i.test(url)) return "arXiv";
  if (/huggingface\.co\/papers/i.test(url)) return "HF Papers";
  return "Blog";
}

// Helper YouTube THUẦN (không phụ thuộc thư viện) đặt ở đây để frontend/articles.ts
// dùng được mà KHÔNG kéo theo `youtube-transcript` (lib chỉ chạy ở backend) vào bundle.

/** Lấy videoId từ mọi dạng URL YouTube (watch, youtu.be, shorts, embed). */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /\/shorts\/([\w-]{11})/,
    /\/embed\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

/** URL xem video chuẩn (dùng làm gốc cho link nhảy mốc thời gian ở frontend). */
export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
