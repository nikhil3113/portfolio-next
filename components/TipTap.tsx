"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Blockquote from "@tiptap/extension-blockquote";
import Link from "@tiptap/extension-link";
import Paragraph from "@tiptap/extension-paragraph";
import Document from "@tiptap/extension-document";
import Text from "@tiptap/extension-text";
import CodeBlock from "@tiptap/extension-code-block";
import { UndoRedo } from "@tiptap/extensions";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

import {
  Undo2,
  Redo2,
  Link as LinkIcon,
  Quote,
  List,
  ListOrdered,
  CodeXml,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";

interface TipTapProps {
  value: string;
  onChange: (value: string) => void;
}

export function TipTap({ value, onChange }: TipTapProps) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      CodeBlock.configure({
        defaultLanguage: "javascript",
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-blue-500 underline",
        },
      }),
      UndoRedo,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral max-w-none min-h-[300px] p-4 focus:outline-none border border-gray-200 rounded-md",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) return null;

  const setCodeBlockLanguage = (lang: string) => {
    editor.chain().focus().setCodeBlock({ language: lang }).run();
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-700">
        <div className="flex flex-wrap gap-1">
          {/* Text Formatting */}
          <Button
            type="button"
            variant={editor.isActive("bold") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("italic") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("underline") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Headings */}
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 1 }) ? "default" : "outline"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 2 }) ? "default" : "outline"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 3 }) ? "default" : "outline"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="w-4 h-4" />
          </Button>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Lists */}
          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("blockquote") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="w-4 h-4" />
          </Button>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Links */}
          <Button
            type="button"
            variant={editor.isActive("link") ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const url = window.prompt("Enter URL");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive("link")}
          >
            Unlink
          </Button>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Code Block */}
          <Button
            type="button"
            variant={editor.isActive("codeBlock") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <CodeXml className="h-4 w-4" />
          </Button>

          {/* Language select for code block */}
          {editor.isActive("codeBlock") && (
            <select
              className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm bg-white"
              value={editor.getAttributes("codeBlock").language || "javascript"}
              onChange={(e) => setCodeBlockLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="json">JSON</option>
              <option value="html">HTML</option>
            </select>
          )}

          {/* Separator */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* History */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
