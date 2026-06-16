// Keyword whitelist — article must match at least one to be processed by Claude.
// Prevents wasting tokens on personal lifestyle posts from social feeds.
const AI_KEYWORDS = [
  "ai",
  "llm",
  "gpt",
  "claude",
  "openai",
  "anthropic",
  "prompt",
  "model",
  "machine learning",
  "deep learning",
  "tech",
  "software",
  "tool",
  "code",
  "data",
  "agent",
  "automation",
  "framework",
  "nvidia",
  "google",
  "meta",
  "apple",
  "microsoft",
  "python",
  "api",
  "neural",
  "algorithm",
  "dataset",
  "inference",
  "training",
  "benchmark",
  "research",
  "paper",
  "open source",
  "github",
  "huggingface",
  "transformer",
  "rag",
  "vector",
  "embedding",
  "chatbot",
  "robot",
];

/**
 * Cheap keyword pre-filter: returns false (→ skip) when title+content
 * contain none of the AI/tech whitelist keywords.
 * Called BEFORE the Claude API to avoid wasting tokens on off-topic posts.
 */
export function isAiRelated(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();
  return AI_KEYWORDS.some((kw) => text.includes(kw));
}
