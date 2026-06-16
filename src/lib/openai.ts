import OpenAI from "openai";
import type { ArticleAnalysis } from "@/lib/anthropic";
import { toStringArray } from "@/lib/anthropic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Nhánh YouTube dùng gpt-4o-mini (rẻ) thay cho Claude Haiku.
// Khác biệt cốt lõi so với prompt của Blog/Substack: summary_points PHẢI là
// các mốc thời gian TĂNG DẦN dạng "[Phút:Giây] Nội dung..." để frontend bắt regex
// và biến thành link nhảy đúng giây trên video.
const SYSTEM_PROMPT = `Bạn là Biên tập viên của "AI Expert Hub" — nền tảng tổng hợp AI Ứng dụng (Practical AI)
cho người Việt làm giáo dục, công việc tri thức và tự động hoá.

Bạn nhận TIÊU ĐỀ và NỘI DUNG một VIDEO YouTube (mô tả / timeline tác giả / phụ đề kèm mốc thời gian).
Nhiệm vụ: biên tập lại cho độc giả Việt Nam theo đúng các yêu cầu sau, luôn gọi tool save_youtube_summary.

1. title_vi: Dịch tiêu đề tự nhiên, hấp dẫn, không clickbait sai sự thật, tối đa ~70 ký tự.

2. summary_points (QUAN TRỌNG NHẤT): Tóm tắt video theo CÁC MỐC THỜI GIAN TĂNG DẦN.
   - Mỗi phần tử là MỘT dòng, BẮT BUỘC mở đầu bằng mốc thời gian dạng "[Phút:Giây]" (ví dụ "[01:25]").
   - Sau mốc là nội dung tiếng Việt cô đọng của đoạn đó (dưới 25 từ).
   - Sắp xếp tăng dần theo thời gian. Tạo 4-8 mốc bao quát toàn video.
   - Lấy mốc từ timeline tác giả nếu có; nếu chỉ có phụ đề thì tự chia mốc hợp lý theo nội dung.

3. actionable_takeaway ("Ứng dụng thực tế") — BẮT BUỘC:
   - Người làm giáo dục / tri thức ở Việt Nam áp dụng NGAY được gì? Viết dạng hành động ("Hãy thử...", "Áp dụng...").

4. ai_tools ("Tags công cụ") — BẮT BUỘC:
   - Liệt kê tên riêng các công cụ AI được nhắc trực tiếp (ChatGPT, Claude, Midjourney...). Không nhắc → [].

5. tags: 1-3 tag từ: #Prompting, #Automation, #Education, #Workplace, #Productivity, #AITools, #Research, #Writing, #BusinessStrategy, #Ethics. Không khớp → đề xuất 1 tag mới dạng #TênChuDe.

NGUYÊN TẮC: giọng chuyên nghiệp, gần gũi; không bịa ngoài nội dung gốc (trừ actionable_takeaway được suy luận hợp lý).
Nếu video KHÔNG liên quan AI/công nghệ → gọi tool với should_skip: true, các trường còn lại để rỗng.`;

const SUMMARY_TOOL = {
  type: "function" as const,
  function: {
    name: "save_youtube_summary",
    description: "Lưu kết quả tóm tắt video YouTube theo mốc thời gian cho AI Expert Hub",
    parameters: {
      type: "object" as const,
      properties: {
        should_skip: {
          type: "boolean",
          description: "true nếu video không liên quan AI/tech — hệ thống bỏ qua, không lưu DB",
        },
        title_vi: { type: "string" },
        summary_points: {
          type: "array",
          description: 'Các mốc tăng dần, mỗi phần tử mở đầu bằng "[Phút:Giây]"',
          items: { type: "string" },
        },
        actionable_takeaway: { type: "string" },
        ai_tools: { type: "array", items: { type: "string" } },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["title_vi", "summary_points", "actionable_takeaway", "ai_tools", "tags"],
    },
  },
};

/**
 * Tóm tắt video YouTube bằng gpt-4o-mini.
 * Trả về null khi model gắn cờ should_skip (video không liên quan AI/tech) —
 * caller xử lý giống nhánh Anthropic: bỏ qua, KHÔNG tính là lỗi.
 */
export async function analyzeYouTubeVideo(title: string, content: string): Promise<ArticleAnalysis | null> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1500,
    tools: [SUMMARY_TOOL],
    tool_choice: { type: "function", function: { name: "save_youtube_summary" } },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `TIÊU ĐỀ:\n${title}\n\nNỘI DUNG VIDEO (mô tả / timeline / phụ đề):\n${content.slice(0, 12000)}`,
      },
    ],
  });

  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") {
    throw new Error("GPT-4o-mini không trả về kết quả tóm tắt hợp lệ");
  }

  let input: Record<string, unknown>;
  try {
    input = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
  } catch {
    throw new Error("GPT-4o-mini trả về arguments không phải JSON hợp lệ");
  }

  if (input.should_skip === true) return null;

  return {
    title_vi: String(input.title_vi ?? ""),
    summary_points: toStringArray(input.summary_points),
    actionable_takeaway: String(input.actionable_takeaway ?? ""),
    ai_tools: toStringArray(input.ai_tools),
    tags: toStringArray(input.tags),
  };
}
