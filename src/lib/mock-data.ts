export type SourcePlatform = "X" | "Bluesky" | "Blog" | "YouTube" | "arXiv" | "GitHub" | "HF Papers";

export interface ExpertSummary {
  id: string;
  name: string;
  initials: string;
  articleCount: number;
}

export interface SourceSummary {
  id: string;
  name: SourcePlatform;
  count: number;
  dotColor: string;
}

export interface Article {
  id: string;
  expertName: string;
  expertInitials: string;
  source: SourcePlatform;
  sourceLabel: string;
  time: string;
  isNew: boolean;
  isHot: boolean;
  titleVi: string;
  titleOriginal: string;
  summaryPoints: string[];
  originalSummary: string;
  tags: string[];
  actionableTakeaway: string;
  aiTools: string[];
  bookmarked: boolean;
}

export interface DigestItem {
  emoji: string;
  text: string;
}

export interface TrendingTopic {
  tag: string;
  count: number;
}

export const filters = [
  { id: "all", label: "Tất cả", count: 1482 },
  { id: "deep", label: "Chuyên sâu", count: 398 },
  { id: "saved", label: "Đã lưu", count: 3 },
];

export const sources: SourceSummary[] = [
  { id: "x", name: "X", count: 1057, dotColor: "bg-ink" },
  { id: "bluesky", name: "Bluesky", count: 27, dotColor: "bg-sky-400" },
  { id: "blog", name: "Blog", count: 100, dotColor: "bg-emerald-400" },
  { id: "youtube", name: "YouTube", count: 38, dotColor: "bg-red-500" },
  { id: "arxiv", name: "arXiv", count: 1, dotColor: "bg-violet-400" },
  { id: "hfpapers", name: "HF Papers", count: 210, dotColor: "bg-yellow-400" },
  { id: "github", name: "GitHub", count: 18, dotColor: "bg-slate-300" },
];

export const experts: ExpertSummary[] = [
  { id: "ak", name: "AK (_akhaliq)", initials: "AK", articleCount: 352 },
  { id: "simon-willison", name: "Simon Willison", initials: "SW", articleCount: 121 },
  { id: "swyx", name: "swyx (Shawn ...", initials: "SX", articleCount: 112 },
  { id: "clement-delangue", name: "Clement Delan...", initials: "CD", articleCount: 109 },
  { id: "ethan-mollick", name: "Ethan Mollick", initials: "EM", articleCount: 89 },
  { id: "jeremy-howard", name: "Jeremy Howard", initials: "JH", articleCount: 79 },
  { id: "yann-lecun", name: "Yann LeCun", initials: "YL", articleCount: 69 },
];

export const digestItems: DigestItem[] = [
  {
    emoji: "🎯",
    text: "Các Bài Học Về Chính Sách & Tương Lai AI",
  },
  {
    emoji: "🛡️",
    text: "Tập Trung Quyền Lực ≠ An Toàn — Yann LeCun nêu vấn đề rõ ràng: nếu...",
  },
  {
    emoji: "🐢",
    text: "Điều Cân Bằng: Cách Làm Chậm AI Đúng Cách — Jeremy Howard đề...",
  },
];

export const trendingTopics: TrendingTopic[] = [
  { tag: "#LLM", count: 235 },
  { tag: "#Benchmark", count: 58 },
  { tag: "#Thị giác máy tính", count: 52 },
  { tag: "#Hugging Face", count: 50 },
  { tag: "#Suy luận", count: 49 },
  { tag: "#An toàn AI", count: 48 },
  { tag: "#Anthropic", count: 45 },
  { tag: "#NVIDIA", count: 43 },
];

export const articles: Article[] = [
  {
    id: "1",
    expertName: "Demis Hassabis",
    expertInitials: "DH",
    source: "X",
    sourceLabel: "Bài đăng",
    time: "36 phút trước",
    isNew: true,
    isHot: false,
    titleVi: "DiffusionGemma: Tạo văn bản nhanh gấp 4 lần",
    titleOriginal: "DiffusionGemma: Generating text up to 4x faster",
    summaryPoints: [
      "DiffusionGemma là mô hình thử nghiệm mở của Google, dùng phương pháp khuếch tán (diffusion) để tạo văn bản",
      "Tốc độ nhanh hơn gấp 4 lần so với các mô hình Gemma 4 khác",
      "Sử dụng phương pháp sinh toàn bộ khối văn bản cùng một lúc thay vì tuần tự từ theo từ",
      "Phát hành dưới giấy phép Apache 2.0, cho phép sử dụng và tích hợp tự do",
      "Demis Hassabis hào hứng với tiềm năng ứng dụng của công nghệ này",
    ],
    originalSummary:
      "DiffusionGemma is Google's experimental open model that uses a diffusion-based approach to generate text. " +
      "It is up to 4x faster than other Gemma 4 models because it generates whole blocks of text at once instead of token-by-token. " +
      "Released under the Apache 2.0 license, free to use and integrate.",
    tags: ["#Tạo văn bản", "#Gemma", "#Diffusion models", "#Google"],
    actionableTakeaway:
      "Nếu bạn xây dựng công cụ soạn nội dung hàng loạt (email, slide, mô tả sản phẩm), hãy thử thay model sinh văn bản tuần tự bằng một model diffusion như DiffusionGemma để giảm thời gian chờ phản hồi tới 4 lần — đặc biệt hữu ích cho các tác vụ tạo nội dung theo lô.",
    aiTools: ["Gemma", "DiffusionGemma"],
    bookmarked: false,
  },
  {
    id: "2",
    expertName: "Simon Willison",
    expertInitials: "SW",
    source: "GitHub",
    sourceLabel: "Release",
    time: "khoảng 2 giờ trước",
    isNew: true,
    isHot: true,
    titleVi: "Phát hành datasette-agent 0.2a0 trên GitHub bởi Simon Willison",
    titleOriginal: "datasette-agent 0.2a0 released on GitHub by Simon Willison",
    summaryPoints: [
      "Simon Willison công bố phát hành version 0.2a0 của datasette-agent trên GitHub repository datasette/datasette-agent ngày 10 tháng 6 năm 2026",
      "Phiên bản này cho phép các công cụ hỏi người dùng câu hỏi giữa lúc thực thi công việc",
      "Công cụ có thể yêu cầu xác nhận từ người dùng cho các hành động quan trọng như lưu trữ truy vấn SQL được tạo bởi agent",
    ],
    originalSummary:
      "Simon Willison announced the release of datasette-agent 0.2a0 on the datasette/datasette-agent GitHub repository on June 10, 2026. " +
      "This release lets tools ask the user questions mid-execution, and request confirmation for important actions such as saving agent-generated SQL queries.",
    tags: ["#Datasette", "#Release", "#Agent"],
    actionableTakeaway:
      "Nếu bạn đang xây quy trình tự động hoá dữ liệu (vd. tự sinh báo cáo SQL), hãy thử cập nhật lên datasette-agent 0.2a0 để thêm bước 'xác nhận của người dùng' trước khi agent lưu hoặc chạy truy vấn quan trọng — giảm rủi ro agent tự ý thực hiện hành động sai.",
    aiTools: ["Datasette", "datasette-agent"],
    bookmarked: true,
  },
  {
    id: "3",
    expertName: "Simon Willison",
    expertInitials: "SW",
    source: "Blog",
    sourceLabel: "Bài viết",
    time: "khoảng 2 giờ trước",
    isNew: true,
    isHot: true,
    titleVi: "Phát hành datasette-agent 0.2a0 với tính năng hỏi người dùng giữa lúc thực thi",
    titleOriginal: "datasette-agent 0.2a0 ships mid-execution user questions",
    summaryPoints: [
      "datasette-agent 0.2a0 cho phép các công cụ hỏi người dùng câu hỏi trong quá trình thực thi - công cụ khai báo tham số 'context' để nhận đối tượng 'ToolContext'",
      "Công cụ sử dụng 'await context.ask_user()' để hỏi yes/no, multiple-choice hoặc free-text questions",
      "Khi câu hỏi chưa được trả lời, agent turn bị tạm dừng - công cụ render thành form trong chat UI và lưu trữ trong database nội bộ để phục hồi sau khi server khởi động lại",
      "Khi câu trả lời được gửi, công cụ thực thi lại từ đầu với câu trả lời đã được lưu replay, đảm bảo không có side effects trước khi người dùng gửi trả lời",
    ],
    originalSummary:
      "datasette-agent 0.2a0 lets tools ask the user questions during execution by declaring a 'context' parameter that receives a 'ToolContext' object. " +
      "Tools call 'await context.ask_user()' for yes/no, multiple-choice or free-text questions. " +
      "While unanswered, the agent turn pauses, the tool is rendered as a form in the chat UI, and state is persisted to an internal database so it survives a server restart. " +
      "Once answered, the tool re-executes from the start with the saved answer replayed, guaranteeing no side effects occur before the user responds.",
    tags: ["#Datasette", "#Release", "#Agent", "#Automation"],
    actionableTakeaway:
      "Khi thiết kế chatbot/agent nội bộ cho công việc, hãy áp dụng pattern 'ask_user() giữa lúc thực thi' này: để agent dừng lại hỏi xác nhận trước khi thực hiện hành động không thể hoàn tác (gửi email, xoá dữ liệu...) — tăng độ tin cậy khi đưa agent vào quy trình thật.",
    aiTools: ["Datasette", "datasette-agent"],
    bookmarked: false,
  },
  {
    id: "4",
    expertName: "Ethan Mollick",
    expertInitials: "EM",
    source: "Blog",
    sourceLabel: "Bài viết",
    time: "4 giờ trước",
    isNew: false,
    isHot: false,
    titleVi: "Cách dùng AI để \"đọc thay\" hàng trăm bài luận của học sinh trong 1 buổi chiều",
    titleOriginal: "Using AI to read hundreds of student essays in an afternoon",
    summaryPoints: [
      "Mollick mô tả quy trình dùng LLM để chấm sơ bộ và phân loại bài luận theo tiêu chí rubric có sẵn",
      "AI không thay thế giáo viên ở bước chấm điểm cuối cùng, mà giúp lọc ra các bài cần chú ý đặc biệt",
      "Việc đưa rubric chi tiết vào prompt giúp giảm đáng kể độ lệch giữa các lần chấm",
      "Tác giả nhấn mạnh cần kiểm tra ngẫu nhiên một số bài để giám sát chất lượng AI",
    ],
    originalSummary:
      "Mollick describes a workflow for using an LLM to pre-grade and triage essays against an existing rubric. " +
      "AI doesn't replace the teacher's final grade, but helps surface the essays that most need attention. " +
      "Feeding a detailed rubric into the prompt significantly reduces variance between grading passes. " +
      "The author stresses spot-checking a random sample to monitor AI quality.",
    tags: ["#Education", "#Prompting", "#Workplace"],
    actionableTakeaway:
      "Hãy thử tạo một prompt 'rubric chấm bài' chi tiết (tiêu chí + thang điểm + ví dụ điểm cao/thấp), dán vào ChatGPT/Claude cùng 5-10 bài luận để AI chấm sơ bộ và xếp hạng theo mức cần chú ý — bạn chỉ cần tập trung xem lại nhóm bài AI đánh dấu 'cần xem kỹ'.",
    aiTools: ["ChatGPT", "Claude"],
    bookmarked: false,
  },
  {
    id: "5",
    expertName: "Jeremy Howard",
    expertInitials: "JH",
    source: "YouTube",
    sourceLabel: "Video",
    time: "6 giờ trước",
    isNew: false,
    isHot: false,
    titleVi: "Điều Cân Bằng: Cách Làm Chậm AI Đúng Cách",
    titleOriginal: "The Balance: How to Slow Down AI the Right Way",
    summaryPoints: [
      "Jeremy Howard thảo luận về sự đánh đổi giữa tốc độ phát triển AI và an toàn",
      "Đề xuất các 'điểm dừng' (checkpoints) thực tế cho các nhóm phát triển AI quy mô nhỏ",
      "So sánh quy định AI hiện tại với các ngành công nghiệp khác đã trải qua giai đoạn tương tự",
    ],
    originalSummary:
      "Jeremy Howard discusses the trade-off between AI development speed and safety, proposing practical 'checkpoints' for small AI teams, " +
      "and comparing current AI regulation to other industries that went through a similar phase.",
    tags: ["#An toàn AI", "#BusinessStrategy"],
    actionableTakeaway:
      "Nếu nhóm của bạn đang triển khai AI vào quy trình làm việc, hãy thử lập một danh sách 'checkpoint' đơn giản (vd. review trước khi gửi email tự động, kiểm tra ngẫu nhiên 1/10 output) trước khi mở rộng quy mô sử dụng — áp dụng đúng tinh thần 'làm chậm có chủ đích' mà Howard đề xuất.",
    aiTools: [],
    bookmarked: false,
  },
  {
    id: "6",
    expertName: "Yann LeCun",
    expertInitials: "YL",
    source: "X",
    sourceLabel: "Bài đăng",
    time: "8 giờ trước",
    isNew: false,
    isHot: false,
    titleVi: "Tập Trung Quyền Lực Không Đồng Nghĩa Với An Toàn",
    titleOriginal: "Concentration of Power ≠ Safety",
    summaryPoints: [
      "Yann LeCun cảnh báo việc chỉ một vài công ty kiểm soát mô hình AI mạnh nhất không tự động làm AI an toàn hơn",
      "Ông ủng hộ hướng đi mô hình mở (open-weight) để tăng tính minh bạch và kiểm chứng độc lập",
      "So sánh với lịch sử phát triển hệ điều hành và internet mở",
    ],
    originalSummary:
      "Yann LeCun argues that a handful of companies controlling the most powerful AI models doesn't automatically make AI safer. " +
      "He advocates for open-weight models to increase transparency and independent verification, drawing parallels with the history of open operating systems and the internet.",
    tags: ["#An toàn AI", "#Ethics", "#Anthropic"],
    actionableTakeaway:
      "Khi đánh giá công cụ AI cho tổ chức/lớp học của bạn, hãy thử cân nhắc thêm các model mã nguồn mở (vd. Llama, Gemma) bên cạnh các dịch vụ đóng — điều này giúp bạn hiểu rõ hơn cách model hoạt động và không bị phụ thuộc hoàn toàn vào một nhà cung cấp.",
    aiTools: ["Llama", "Gemma"],
    bookmarked: false,
  },
];
