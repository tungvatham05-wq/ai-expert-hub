import OpenAI from "openai";

// Tái dùng đúng OPENAI_API_KEY của dự án (KHÔNG tạo key mới) — giống nhánh YouTube & chatbot.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SCRIPT_MODEL = "gpt-4o-mini";
// TTS: model giọng nói rẻ của OpenAI. response_format mp3 để phát inline bằng <audio>.
const TTS_MODEL = "gpt-4o-mini-tts";

// 2 giọng cho người nghe chọn (tên OpenAI voice — đều đọc tiếng Việt tốt).
export type PodcastVoice = "male" | "female";
const TTS_VOICE_IDS: Record<PodcastVoice, string> = {
  male: "onyx", // giọng nam, trầm ấm
  female: "coral", // giọng nữ, ấm & ngọt — biểu cảm theo instructions
};

// Chỉ dẫn tông giọng riêng cho từng giọng (gpt-4o-mini-tts nghe theo instructions).
const TTS_INSTRUCTIONS: Record<PodcastVoice, string> = {
  male: "Đọc bằng tiếng Việt, giọng nam ấm áp, rõ ràng, thân thiện, nhịp vừa phải như người dẫn podcast.",
  female:
    "Đọc bằng tiếng Việt, giọng nữ nhẹ nhàng, ngọt ngào, ấm áp và truyền cảm, nhịp khoan thai dễ chịu như người dẫn podcast tâm tình.",
};

// Chuẩn hoá tham số voice từ query về một giá trị hợp lệ (mặc định nam).
export function normalizeVoice(value: string | null | undefined): PodcastVoice {
  return value === "female" ? "female" : "male";
}

// OpenAI TTS giới hạn ~4096 ký tự / lần. Giữ kịch bản gọn để vừa 1 lần gọi
// và cho ra podcast ~2-3 phút (một người dẫn, monologue).
const MAX_TTS_CHARS = 4000;

const SCRIPT_SYSTEM_PROMPT = `Bạn là người dẫn chương trình podcast tiếng Việt của "AI Expert Hub" —
một bản tin AI ứng dụng cho người Việt làm giáo dục, công việc tri thức và tự động hoá.

Nhiệm vụ: từ nội dung một bài báo/video, viết KỊCH BẢN LỜI DẪN cho MỘT người dẫn (monologue)
để đọc thành podcast. Yêu cầu:
- Văn nói tự nhiên, mạch lạc, thân thiện như đang trò chuyện với thính giả; KHÔNG phải văn viết.
- Mở đầu chào ngắn gọn ("Chào bạn, ..."), giới thiệu chủ đề; thân bài trình bày 3-5 ý chính dễ hiểu;
  nêu phần "ứng dụng thực tế" thính giả làm được ngay; kết bằng một câu chốt + lời chào tạm biệt.
- CHỈ trả về lời cần đọc thành tiếng. TUYỆT ĐỐI không markdown, không tiêu đề, không gạch đầu dòng,
  không ghi chú sân khấu, không nhãn "Người dẫn:", không mốc thời gian.
- Độ dài khoảng 250-450 từ (đọc khoảng 2-3 phút). Diễn đạt lại bằng lời của bạn, không bịa thông tin ngoài bài.`;

/**
 * Sinh kịch bản lời dẫn (monologue tiếng Việt) từ nội dung bài báo, bằng gpt-4o-mini.
 * Trả về plain text thuần để đưa thẳng vào TTS.
 */
export async function generatePodcastScript(input: {
  titleVi: string;
  originalTitle?: string | null;
  summaryPoints?: string | null;
  actionable?: string | null;
  content?: string | null;
}): Promise<string> {
  const parts: string[] = [`Tiêu đề (VI): ${input.titleVi}`];
  if (input.originalTitle) parts.push(`Tiêu đề gốc: ${input.originalTitle}`);
  if (input.summaryPoints) parts.push(`\nCác ý chính:\n${input.summaryPoints}`);
  if (input.actionable) parts.push(`\nỨng dụng thực tế:\n${input.actionable}`);
  if (input.content) parts.push(`\nNội dung gốc:\n${input.content.slice(0, 8000)}`);

  const completion = await openai.chat.completions.create({
    model: SCRIPT_MODEL,
    max_tokens: 900,
    temperature: 0.6,
    messages: [
      { role: "system", content: SCRIPT_SYSTEM_PROMPT },
      { role: "user", content: parts.join("\n") },
    ],
  });

  const script = completion.choices[0]?.message?.content?.trim();
  if (!script) throw new Error("gpt-4o-mini không trả về kịch bản podcast");
  return script;
}

/**
 * Tổng hợp giọng nói tiếng Việt từ kịch bản, bằng OpenAI TTS gpt-4o-mini-tts.
 * Trả về Buffer dữ liệu mp3 (sẵn sàng upload lên Supabase Storage).
 */
export async function synthesizePodcastAudio(script: string, voice: PodcastVoice = "male"): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: TTS_MODEL,
    voice: TTS_VOICE_IDS[voice],
    input: script.slice(0, MAX_TTS_CHARS),
    response_format: "mp3",
    instructions: TTS_INSTRUCTIONS[voice],
  });

  return Buffer.from(await response.arrayBuffer());
}
