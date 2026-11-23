export type ArticleMark = {
  type: "bold" | "italic" | "underline" | "strike" | "code" | "link";
  attrs?: { href?: string };
};

export type ArticleNode = {
  type: string;
  text?: string;
  attrs?: Record<string, string | number | boolean>;
  marks?: ArticleMark[];
  content?: ArticleNode[];
};

export type ArticleDocument = { type: "doc"; content: ArticleNode[] };

const nodeTypes = new Set([
  "doc", "paragraph", "heading", "blockquote", "bulletList", "orderedList", "listItem",
  "codeBlock", "horizontalRule", "hardBreak", "text", "image",
]);
const markTypes = new Set(["bold", "italic", "underline", "strike", "code", "link"]);
const safeHrefPattern = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

export function safeArticleHref(href?: string) {
  const value = href?.trim();
  return value && safeHrefPattern.test(value) ? value : undefined;
}

function sanitizeMark(value: unknown): ArticleMark | undefined {
  if (!value || typeof value !== "object") return undefined;
  const mark = value as Record<string, unknown>;
  if (typeof mark.type !== "string" || !markTypes.has(mark.type)) return undefined;
  if (mark.type !== "link") return { type: mark.type as ArticleMark["type"] };
  const attrs = mark.attrs && typeof mark.attrs === "object" ? mark.attrs as Record<string, unknown> : {};
  const href = safeArticleHref(typeof attrs.href === "string" ? attrs.href : undefined);
  return href ? { type: "link", attrs: { href } } : undefined;
}

function sanitizeNode(value: unknown, depth = 0): ArticleNode | undefined {
  if (!value || typeof value !== "object" || depth > 20) return undefined;
  const node = value as Record<string, unknown>;
  if (typeof node.type !== "string" || !nodeTypes.has(node.type)) return undefined;
  const result: ArticleNode = { type: node.type };

  if (node.type === "text") {
    if (typeof node.text !== "string" || node.text.length > 50000) return undefined;
    result.text = node.text;
    if (Array.isArray(node.marks)) {
      const marks = node.marks.map(sanitizeMark).filter((mark): mark is ArticleMark => Boolean(mark));
      if (marks.length) result.marks = marks;
    }
    return result;
  }

  if (node.type === "heading") {
    const attrs = node.attrs && typeof node.attrs === "object" ? node.attrs as Record<string, unknown> : {};
    const level = attrs.level === 3 ? 3 : 2;
    result.attrs = { level };
  } else if (node.type === "orderedList") {
    const attrs = node.attrs && typeof node.attrs === "object" ? node.attrs as Record<string, unknown> : {};
    const start = typeof attrs.start === "number" && Number.isInteger(attrs.start) && attrs.start > 0 ? attrs.start : 1;
    result.attrs = { start };
  } else if (node.type === "image") {
    const attrs = node.attrs && typeof node.attrs === "object" ? node.attrs as Record<string, unknown> : {};
    const src = typeof attrs.src === "string" ? attrs.src : "";
    const alt = typeof attrs.alt === "string" ? attrs.alt : "";
    const title = typeof attrs.title === "string" ? attrs.title : undefined;
    if (!src) return undefined;
    result.attrs = { src, alt, ...(title ? { title } : {}) };
  }

  if (Array.isArray(node.content)) {
    result.content = node.content.map((child) => sanitizeNode(child, depth + 1)).filter((child): child is ArticleNode => Boolean(child));
  }
  return result;
}

function legacyRunsToNodes(value: unknown): ArticleNode[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((run) => {
    if (!run || typeof run !== "object" || typeof (run as Record<string, unknown>).text !== "string") return [];
    const textRun = run as Record<string, unknown>;
    const marks: ArticleMark[] = Array.isArray(textRun.marks)
      ? textRun.marks
        .filter((mark): mark is ArticleMark["type"] => typeof mark === "string" && ["bold", "italic", "underline"].includes(mark))
        .map((type) => ({ type }))
      : [];
    const href = safeArticleHref(typeof textRun.href === "string" ? textRun.href : undefined);
    if (href) marks.push({ type: "link", attrs: { href } });
    return [{ type: "text", text: textRun.text as string, ...(marks.length ? { marks } : {}) }];
  });
}

function decodeLegacyDocument(value: unknown): ArticleDocument | undefined {
  if (!value || typeof value !== "object") return undefined;
  const legacy = value as Record<string, unknown>;
  if (legacy.version !== 1 || !Array.isArray(legacy.blocks)) return undefined;
  const content: ArticleNode[] = [];
  for (const item of legacy.blocks) {
    if (!item || typeof item !== "object") continue;
    const block = item as Record<string, unknown>;
    const runs = Array.isArray(block.content) ? block.content : undefined;
    if (runs && ["paragraph", "heading2", "heading3", "quote"].includes(String(block.type))) {
      const children = legacyRunsToNodes(runs);
      const type = block.type === "heading2" || block.type === "heading3" ? "heading" : block.type === "quote" ? "blockquote" : "paragraph";
      content.push({ type, ...(type === "heading" ? { attrs: { level: block.type === "heading3" ? 3 : 2 } } : {}), content: children });
      continue;
    }
    if ((block.type === "unorderedList" || block.type === "orderedList") && Array.isArray(block.items)) {
      const listItems = block.items.flatMap((runs) => {
        if (!Array.isArray(runs)) return [];
        const itemContent = legacyRunsToNodes(runs);
        return [{ type: "listItem", content: [{ type: "paragraph", content: itemContent }] }];
      });
      content.push({ type: block.type === "orderedList" ? "orderedList" : "bulletList", ...(block.type === "orderedList" ? { attrs: { start: 1 } } : {}), content: listItems });
    }
  }
  return { type: "doc", content };
}

export function decodeArticleContent(value: string): ArticleDocument {
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && (parsed as Record<string, unknown>).type === "doc") {
      const document = sanitizeNode(parsed);
      if (document?.type === "doc") return { type: "doc", content: document.content ?? [] };
    }
    const legacy = decodeLegacyDocument(parsed);
    if (legacy) return legacy;
  } catch {
    // Existing articles are plain text; keep them readable while migrating to rich text.
  }
  const paragraphs = value.split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean);
  return {
    type: "doc",
    content: paragraphs.map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })),
  };
}

export function encodeArticleContent(document: ArticleDocument) {
  return JSON.stringify(document);
}
