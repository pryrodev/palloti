import type { ReactNode } from "react";
import { decodeArticleContent, safeArticleHref, type ArticleMark, type ArticleNode } from "@/lib/articleRichText";

function renderMark(mark: ArticleMark, child: ReactNode, key: string) {
  switch (mark.type) {
    case "bold": return <strong key={key}>{child}</strong>;
    case "italic": return <em key={key}>{child}</em>;
    case "underline": return <u key={key}>{child}</u>;
    case "strike": return <s key={key}>{child}</s>;
    case "code": return <code key={key} className="bg-[var(--cream2)] px-1">{child}</code>;
    case "link": {
      const href = safeArticleHref(mark.attrs?.href);
      return href ? <a key={key} href={href} className="text-[var(--red)] underline underline-offset-4">{child}</a> : child;
    }
  }
}

function renderNode(node: ArticleNode, key: string): ReactNode {
  if (node.type === "text") {
    let text: ReactNode = <span className="whitespace-pre-wrap">{node.text}</span>;
    for (const [index, mark] of (node.marks ?? []).entries()) text = renderMark(mark, text, `${key}-mark-${index}`);
    return <span key={key}>{text}</span>;
  }
  if (node.type === "hardBreak") return <br key={key} />;

  const children = node.content?.map((child, index) => renderNode(child, `${key}-${index}`)) ?? [];
  switch (node.type) {
    case "doc": return <div key={key} className="flex flex-col gap-6">{children}</div>;
    case "paragraph": return <p key={key}>{children}</p>;
    case "heading": return node.attrs?.level === 3
      ? <h3 key={key} className="font-serif text-xl font-bold leading-snug text-[var(--dark)]">{children}</h3>
      : <h2 key={key} className="font-serif text-2xl font-bold leading-snug text-[var(--dark)]">{children}</h2>;
    case "blockquote": return <blockquote key={key} className="border-l-2 border-[var(--gold)] pl-5 italic text-[var(--dark)]">{children}</blockquote>;
    case "bulletList": return <ul key={key} className="list-disc pl-6">{children}</ul>;
    case "orderedList": return <ol key={key} start={typeof node.attrs?.start === "number" ? node.attrs.start : 1} className="list-decimal pl-6">{children}</ol>;
    case "listItem": return <li key={key}>{children}</li>;
    case "codeBlock": return <pre key={key} className="overflow-x-auto bg-[var(--cream2)] p-4 text-sm"><code>{children}</code></pre>;
    case "horizontalRule": return <hr key={key} className="border-[var(--cream3)]" />;
    case "image": return (
      <figure key={key} className="my-6">
        <img
          src={String(node.attrs?.src ?? "")}
          alt={String(node.attrs?.alt ?? "")}
          className="mx-auto max-h-[520px] w-auto max-w-full rounded-sm border border-[var(--cream3)] object-contain shadow-xs"
        />
        {node.attrs?.title && (
          <figcaption className="mt-2 text-center text-xs italic text-[var(--mid)]">
            {String(node.attrs.title)}
          </figcaption>
        )}
      </figure>
    );
    default: return null;
  }
}

export default function ArticleBody({ content, fallback }: { content: string; fallback: string }) {
  const document = decodeArticleContent(content.trim() || fallback);
  return (
    <div className="text-base leading-8 text-[var(--mid)] sm:text-lg sm:leading-9">
      {renderNode(document, "article")}
    </div>
  );
}
