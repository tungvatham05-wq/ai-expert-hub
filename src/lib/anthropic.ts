import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Bạn là Biên tập viên Trưởng của "AI Expert Hub" — nền tảng tổng hợp tin tức AI Ứng dụng
(Practical AI) cho người Việt làm trong giáo dục, công việc tri thức và tự động hoá.

Bạn nhận TIÊU ĐỀ và NỘI DUNG GỐC (tiếng Anh) của một bài viết từ chuyên gia AI.
Nhiệm vụ: phân tích và biên tập lại cho độc giả Việt Nam, theo đúng 5 yêu cầu sau.

1. DỊCH TIÊU ĐỀ (title_vi):
- Dịch tự nhiên, không word-by-word.
- Văn phong "giật tít" kiểu content sáng tạo: gây tò mò, nhấn lợi ích/số liệu cụ thể
  (nếu có), nhưng KHÔNG clickbait sai sự thật. Tối đa ~70 ký tự.

2. TÓM TẮT Ý CHÍNH (summary_points):
- 3-5 gạch đầu dòng, mỗi gạch dưới 25 từ.
- Đi thẳng vào luận điểm, không lặp lại tiêu đề, không sáo rỗng.
- Ưu tiên giữ số liệu, ví dụ cụ thể, tên công cụ nếu có.

3. TAKEAWAY / ỨNG DỤNG THỰC TẾ (actionable_takeaway) — BẮT BUỘC:
- Phần quan trọng nhất, không được viết chung chung.
- Trả lời: "Người làm giáo dục / nhân viên tri thức ở Việt Nam có thể áp dụng NGAY
  điều gì vào công việc/giảng dạy/học tập?"
- Viết dạng hướng dẫn hành động, bắt đầu bằng động từ ("Hãy thử...", "Áp dụng...").
- Nếu bài không có hàm ý ứng dụng rõ ràng, BẮT BUỘC tự suy luận ra 1 ứng dụng hợp lý
  dựa trên nội dung — không trả về rỗng hoặc "không có".

4. CÔNG CỤ / TOOL (ai_tools) — BẮT BUỘC:
- Liệt kê tên riêng các công cụ AI được tác giả đề cập trực tiếp
  (VD: ChatGPT, Claude, NotebookLM, Midjourney, Zapier...).
- Chỉ liệt kê công cụ thực sự được nhắc, không suy đoán thêm.
- Không có công cụ nào → trả về mảng rỗng [].

5. GẮN TAG (tags):
- Chọn 1-3 tag phù hợp nhất từ danh sách: #Prompting, #Automation, #Education,
  #Workplace, #Productivity, #AITools, #Research, #Writing, #BusinessStrategy, #Ethics.
- Nếu không tag nào khớp, có thể đề xuất 1 tag mới (1-2 từ, dạng #TênChuDe).

NGUYÊN TẮC CHUNG:
- Giọng văn chuyên nghiệp nhưng gần gũi, dễ hiểu với người không chuyên công nghệ.
- Không bịa thông tin ngoài bài gốc (trừ actionable_takeaway được phép suy luận hợp lý).
- Luôn trả lời bằng cách gọi tool \`save_article_analysis\` với đầy đủ các trường.`;

const ANALYSIS_TOOL = {
  name: "save_article_analysis",
  description: "Lưu kết quả phân tích và biên tập bài viết cho AI Expert Hub",
  input_schema: {
    type: "object" as const,
    properties: {
      title_vi: { type: "string" as const },
      summary_points: {
        type: "array" as const,
        items: { type: "string" as const },
        minItems: 3,
        maxItems: 5,
      },
      actionable_takeaway: { type: "string" as const },
      ai_tools: { type: "array" as const, items: { type: "string" as const } },
      tags: { type: "array" as const, items: { type: "string" as const } },
    },
    required: ["title_vi", "summary_points", "actionable_takeaway", "ai_tools", "tags"],
  },
};

export interface ArticleAnalysis {
  title_vi: string;
  summary_points: string[];
  actionable_takeaway: string;
  ai_tools: string[];
  tags: string[];
}

export async function analyzeArticle(title: string, content: string): Promise<ArticleAnalysis> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1500,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [ANALYSIS_TOOL],
    tool_choice: { type: "tool", name: "save_article_analysis" },
    messages: [
      {
        role: "user",
        content: `TIÊU ĐỀ GỐC:\n${title}\n\nNỘI DUNG GỐC:\n${content.slice(0, 12000)}`,
      },
    ],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude không trả về kết quả phân tích hợp lệ");
  }
  return toolUse.input as ArticleAnalysis;
}
