import { Fragment, type ReactNode } from "react";

// Renderer Markdown tối giản, KHÔNG thêm dependency (tránh "rác" hệ thống).
// Hỗ trợ đủ cho câu trả lời của gpt-4o-mini: code block, danh sách, **đậm**, `code`, link.
// An toàn XSS: chỉ tạo text node qua React (không dùng dangerouslySetInnerHTML).

// --- Inline: **đậm**, `code`, [text](url) ---
function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Tách lần lượt theo các mẫu inline.
  const regex = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      nodes.push(<strong key={`${keyBase}-b${i}`}>{m[2]}</strong>);
    } else if (m[4] !== undefined) {
      nodes.push(
        <code key={`${keyBase}-c${i}`} className="rounded bg-canvas-2 px-1 py-0.5 font-mono text-[0.85em] text-accent">
          {m[4]}
        </code>
      );
    } else if (m[6] !== undefined && m[7] !== undefined) {
      nodes.push(
        <a
          key={`${keyBase}-l${i}`}
          href={m[7]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:text-hot"
        >
          {m[6]}
        </a>
      );
    }
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block ```...```
    if (line.trim().startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // bỏ dòng ``` đóng
      blocks.push(
        <pre
          key={key++}
          className="my-2 overflow-x-auto rounded-lg border border-border bg-canvas-2 p-3 font-mono text-xs leading-relaxed text-ink"
        >
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Danh sách (gạch đầu dòng hoặc đánh số)
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        i++;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag
          key={key++}
          className={`my-2 space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"} marker:text-faint`}
        >
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `${key}-li${idx}`)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    // Dòng trống → bỏ qua (ngăn cách block)
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Đoạn văn: gom các dòng liền nhau cho tới dòng trống / block khác
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !/^\s*([-*]|\d+\.)\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-1.5 leading-relaxed">
        {para.map((p, idx) => (
          <Fragment key={idx}>
            {idx > 0 && <br />}
            {renderInline(p, `${key}-p${idx}`)}
          </Fragment>
        ))}
      </p>
    );
  }

  return <div className="text-sm">{blocks}</div>;
}
