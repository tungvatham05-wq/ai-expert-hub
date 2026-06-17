import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Tái sử dụng đúng OPENAI_API_KEY của dự án (đang dùng cho nhánh YouTube).
// Toàn bộ luồng chatbot BẮT BUỘC dùng gpt-4o-mini: rẻ, nhanh, đủ thông minh cho RAG.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHAT_MODEL = "gpt-4o-mini";

export type ChatRole = "user" | "assistant" | "system";
export interface ChatTurn {
  role: ChatRole;
  content: string;
}

// Ngữ cảnh bài báo Admin đang đọc khi mở chat (RAG). Tất cả đều tuỳ chọn.
export interface ArticleContext {
  title?: string | null;
  originalTitle?: string | null;
  content?: string | null;
  url?: string | null;
}

const SYSTEM_PROMPT = `Bạn là "Trợ lý AI cá nhân" của Admin trên nền tảng AI Expert Hub —
một hub tổng hợp & dịch tin tức công nghệ/AI sang tiếng Việt.

Vai trò: giúp Admin hiểu sâu bài báo/video đang đọc. Giải thích thuật ngữ khó,
bối cảnh, ý nghĩa thực tế một cách rõ ràng, chính xác, ngắn gọn.

NGUYÊN TẮC:
- Trả lời bằng tiếng Việt (trừ khi được yêu cầu khác), giọng chuyên nghiệp mà gần gũi.
- Nếu có NGỮ CẢNH BÀI BÁO bên dưới, ưu tiên bám sát nội dung đó khi trả lời.
- Không bịa đặt. Nếu thông tin không có trong bài và bạn không chắc, hãy nói rõ.
- Dùng Markdown (gạch đầu dòng, **in đậm**, code block) khi giúp câu trả lời dễ đọc hơn.`;

/**
 * Dựng message system kèm ngữ cảnh bài báo (nếu phiên chat gắn với một bài).
 * Cắt nội dung gốc để khống chế token (gpt-4o-mini, tác vụ hỏi đáp).
 */
function buildContextMessage(article?: ArticleContext | null): string | null {
  if (!article) return null;
  const parts: string[] = [];
  if (article.title) parts.push(`Tiêu đề (VI): ${article.title}`);
  if (article.originalTitle) parts.push(`Tiêu đề gốc: ${article.originalTitle}`);
  if (article.url) parts.push(`Nguồn: ${article.url}`);
  if (article.content) parts.push(`\nNội dung bài:\n${article.content.slice(0, 8000)}`);
  if (parts.length === 0) return null;
  return `NGỮ CẢNH BÀI BÁO ADMIN ĐANG ĐỌC:\n${parts.join("\n")}`;
}

/**
 * Gọi gpt-4o-mini sinh câu trả lời cho phiên chat.
 * @param history Toàn bộ lịch sử hội thoại (đã gồm câu hỏi mới nhất ở cuối).
 * @param article Ngữ cảnh bài báo của phiên (nếu có) → ghép vào system prompt.
 */
export async function generateChatReply(
  history: ChatTurn[],
  article?: ArticleContext | null
): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [{ role: "system", content: SYSTEM_PROMPT }];

  const context = buildContextMessage(article);
  if (context) messages.push({ role: "system", content: context });

  for (const turn of history) {
    messages.push({ role: turn.role, content: turn.content });
  }

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    max_tokens: 1200,
    messages,
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) throw new Error("gpt-4o-mini không trả về nội dung trả lời");
  return reply;
}

/**
 * Tự đặt tên phiên chat từ câu hỏi đầu tiên (gpt-4o-mini).
 * Trả về tiêu đề ngắn gọn; nếu lỗi, caller tự fallback.
 */
export async function generateSessionTitle(firstUserMessage: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    max_tokens: 30,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "Đặt một tiêu đề tiếng Việt thật ngắn (tối đa 6 từ) tóm tắt câu hỏi của người dùng. " +
          "CHỈ trả về tiêu đề, không dấu ngoặc kép, không dấu chấm cuối.",
      },
      { role: "user", content: firstUserMessage.slice(0, 500) },
    ],
  });

  const title = completion.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, "");
  return title || "Cuộc trò chuyện mới";
}
