import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

function ToolbarButton({ onClick, isActive, label, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`toolbar-btn${isActive ? " is-active" : ""}`}
      title={title || label}
    >
      {label}
    </button>
  );
}

function Toolbar({ editor }) {
  if (!editor) return null;

  const addLink = () => {
    const url = prompt("Masukkan URL link:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = prompt("Masukkan URL gambar:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addYoutube = () => {
    const url = prompt("Masukkan URL YouTube:");
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  return (
    <div className="editor-toolbar">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        label="B"
        title="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        label="I"
        title="Italic"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        label="S"
        title="Strikethrough"
      />
      <span className="toolbar-divider" />
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        isActive={editor.isActive("heading", { level: 2 })}
        label="H2"
        title="Heading 2"
      />
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        isActive={editor.isActive("heading", { level: 3 })}
        label="H3"
        title="Heading 3"
      />
      <span className="toolbar-divider" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        label="&#8226;"
        title="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        label="1."
        title="Ordered List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        label="&#8220;"
        title="Blockquote"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        label="&lt;/&gt;"
        title="Code Block"
      />
      <span className="toolbar-divider" />
      <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} label="&#128279;" title="Insert Link" />
      <ToolbarButton onClick={addImage} isActive={false} label="&#128247;" title="Insert Image" />
      <ToolbarButton onClick={addYoutube} isActive={false} label="&#9654;" title="Insert YouTube" />
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        isActive={false}
        label="&#8212;"
        title="Horizontal Rule"
      />
      <span className="toolbar-divider" />
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        isActive={false}
        label="&#8617;"
        title="Undo"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        isActive={false}
        label="&#8618;"
        title="Redo"
      />
    </div>
  );
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const newTags = input
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && !tags.includes(t));
    if (newTags.length) {
      onChange([...tags, ...newTags]);
    }
    setInput("");
  };

  const removeTag = (tag) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="tag-input-wrapper">
      <div className="tag-pills">
        {tags.map((tag) => (
          <span key={tag} className="tag-pill">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="tag-remove"
            >
              x
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder="Ketik tag, pisahkan dengan koma"
        className="meta-input"
      />
    </div>
  );
}

export default function ArticleEditor({
  article,
  onSave,
  onCancel,
  existingSlugs = [],
}) {
  const [title, setTitle] = useState(article?.title || "");
  const [subtitle, setSubtitle] = useState(article?.subtitle || "");
  const [tags, setTags] = useState(article?.tags || []);
  const [relatedSlugs, setRelatedSlugs] = useState(
    article?.relatedSlugs?.join(", ") || ""
  );
  const [coverImage, setCoverImage] = useState(article?.coverImage || "");
  const [published, setPublished] = useState(article?.published ?? false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Youtube.configure({ controls: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Mulai menulis artikel..." }),
    ],
    content: article?.content || "",
  });

  const handleSave = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    const related = relatedSlugs
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      title,
      subtitle,
      tags,
      relatedSlugs: related,
      coverImage,
      published,
      content: html,
    });
  }, [
    editor,
    title,
    subtitle,
    tags,
    relatedSlugs,
    coverImage,
    published,
    onSave,
  ]);

  return (
    <div className="article-editor">
      <div className="editor-meta">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul Artikel"
          className="meta-input meta-title"
        />
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subtitle (opsional)"
          className="meta-input meta-subtitle"
        />
        <TagInput tags={tags} onChange={setTags} />
        <input
          type="text"
          value={relatedSlugs}
          onChange={(e) => setRelatedSlugs(e.target.value)}
          placeholder="Related slugs (pisahkan dengan koma)"
          className="meta-input"
        />
        <input
          type="text"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="Cover Image URL (opsional)"
          className="meta-input"
        />
        <label className="meta-checkbox">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Published
        </label>
      </div>

      <Toolbar editor={editor} />
      <div className="editor-content-wrapper">
        <EditorContent editor={editor} />
      </div>

      <div className="editor-actions">
        <button onClick={handleSave} className="btn btn-primary">
          Simpan
        </button>
        <button onClick={onCancel} className="btn btn-secondary">
          Batal
        </button>
      </div>
    </div>
  );
}
