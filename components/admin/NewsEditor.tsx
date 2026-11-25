"use client";

import { useEffect, useState } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { NewsMediaLibrary } from "@/components/admin/NewsMediaLibrary";

export function NewsEditor({
  name = "body",
  initialHtml = "",
}: {
  name?: string;
  initialHtml?: string;
}) {
  const [html, setHtml] = useState(initialHtml);
  const [mediaOpen, setMediaOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({
        placeholder: "Write your article…",
      }),
    ],
    content: initialHtml || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "news-editor-surface",
      },
    },
    onUpdate: ({ editor: current }) => {
      setHtml(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    setHtml(editor.getHTML());
  }, [editor]);

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className="news-editor">
      <input type="hidden" name={name} value={html} />
      <div className="news-editor-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" className={editor?.isActive("bold") ? "active" : ""} disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}>
          Bold
        </button>
        <button type="button" className={editor?.isActive("italic") ? "active" : ""} disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          Italic
        </button>
        <button type="button" className={editor?.isActive("underline") ? "active" : ""} disabled={!editor} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
          Underline
        </button>
        <span className="toolbar-sep" />
        <button type="button" className={editor?.isActive("heading", { level: 2 }) ? "active" : ""} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
        <button type="button" className={editor?.isActive("heading", { level: 3 }) ? "active" : ""} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </button>
        <span className="toolbar-sep" />
        <button type="button" className={editor?.isActive("bulletList") ? "active" : ""} disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          Bullets
        </button>
        <button type="button" className={editor?.isActive("orderedList") ? "active" : ""} disabled={!editor} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          Numbers
        </button>
        <button type="button" className={editor?.isActive("blockquote") ? "active" : ""} disabled={!editor} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
          Quote
        </button>
        <span className="toolbar-sep" />
        <button type="button" className={editor?.isActive("link") ? "active" : ""} disabled={!editor} onClick={setLink}>
          Link
        </button>
        <button type="button" disabled={!editor} onClick={() => setMediaOpen(true)}>
          Add media
        </button>
        <button type="button" disabled={!editor} onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>
          Clear
        </button>
      </div>
      <EditorContent editor={editor} />
      <NewsMediaLibrary
        open={mediaOpen}
        title="Insert media into article"
        onClose={() => setMediaOpen(false)}
        onSelect={(item) => {
          editor?.chain().focus().setImage({ src: item.path, alt: "" }).run();
          setMediaOpen(false);
        }}
      />
    </div>
  );
}
