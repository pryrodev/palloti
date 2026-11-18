"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Underline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decodeArticleContent, encodeArticleContent, safeArticleHref } from "@/lib/articleRichText";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);
  const lastEmittedValue = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: decodeArticleContent(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "article-rich-editor-content min-h-64 max-h-[60vh] overflow-y-auto px-4 py-3 text-sm leading-7 text-[#3e2009] outline-none",
        role: "textbox",
        "aria-label": "Article body",
        "aria-multiline": "true",
        "data-placeholder": "Write the full article here…",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const next = encodeArticleContent(currentEditor.getJSON());
      lastEmittedValue.current = next;
      onChangeRef.current(next);
    },
  });

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editor) return;
    if (lastEmittedValue.current === value) {
      lastEmittedValue.current = null;
      return;
    }
    const nextDocument = decodeArticleContent(value);
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(nextDocument)) {
      editor.commands.setContent(nextDocument, { emitUpdate: false });
    }
  }, [editor, value]);

  function addLink() {
    if (!editor) return;
    const enteredUrl = window.prompt("Enter a link URL");
    const href = safeArticleHref(enteredUrl ?? undefined);
    if (href) editor.chain().focus().setLink({ href }).run();
  }

  const toolbar = [
    { label: "Bold", icon: Bold, action: () => editor?.chain().focus().toggleBold().run() },
    { label: "Italic", icon: Italic, action: () => editor?.chain().focus().toggleItalic().run() },
    { label: "Underline", icon: Underline, action: () => editor?.chain().focus().toggleUnderline().run() },
    { label: "Heading 2", icon: Heading2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Heading 3", icon: Heading3, action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "Bulleted list", icon: List, action: () => editor?.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", icon: ListOrdered, action: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: "Quote", icon: Quote, action: () => editor?.chain().focus().toggleBlockquote().run() },
    { label: "Add link", icon: Link2, action: addLink },
  ];

  return (
    <div className="article-rich-editor overflow-hidden border border-[#C9952A] bg-white focus-within:ring-2 focus-within:ring-[#C9952A]/30">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#eadfd2] bg-[#fbf7f1] p-1" role="toolbar" aria-label="Article formatting">
        {toolbar.map(({ label, icon: Icon, action }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-none"
            aria-label={label}
            title={label}
            disabled={!editor}
            onMouseDown={(event) => event.preventDefault()}
            onClick={action}
          >
            <Icon aria-hidden="true" />
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
