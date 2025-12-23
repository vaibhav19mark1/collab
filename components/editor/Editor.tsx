import {
  useEditor,
  EditorContent,
  Editor as TiptapEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import BulletList from "@tiptap/extension-bullet-list";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Color } from "@tiptap/extension-color";
import Document from "@tiptap/extension-document";
import Dropcursor from "@tiptap/extension-dropcursor";
import Focus from "@tiptap/extension-focus";
import FontFamily from "@tiptap/extension-font-family";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import Text from "@tiptap/extension-text";
import { common, createLowlight } from "lowlight";
import { FontSize } from "./extensions/FontSize";
import {
  SlashCommand,
  slashCommandSuggestion,
} from "./extensions/slash-command";
import { FloatingToolbar } from "./FloatingToolbar";
import { useEffect } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const lowlight = createLowlight(common);

interface EditorProps {
  doc: Y.Doc;
  provider: WebsocketProvider;
  editable?: boolean;
  isConnected: boolean;
  synced: boolean;
  onEditorReady?: (editor: TiptapEditor) => void;
}

export const Editor = ({
  doc,
  provider,
  editable,
  isConnected,
  synced,
  onEditorReady,
}: EditorProps) => {
  const getUserInfo = () => {
    try {
      return (
        provider?.awareness?.getLocalState()?.user || {
          name: "Anonymous",
          color: "#000000",
        }
      );
    } catch (error) {
      console.error("Error getting user info:", error);
      return {
        name: "Anonymous",
        color: "#000000",
      };
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // @ts-expect-error StarterKit configuration allows disabling built-in extensions
        history: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        dropcursor: false,
        document: false,
        paragraph: false,
        text: false,
      }),
      Document,
      Paragraph,
      Text,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList,
      OrderedList,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: null,
      }),
      TextStyle,
      FontSize,
      SlashCommand.configure({
        suggestion: slashCommandSuggestion,
      }),
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Typography,
      HorizontalRule,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Dropcursor,
      Focus.configure({
        className: "has-focus",
        mode: "all",
      }),
      Placeholder.configure({
        placeholder: "Write something...",
      }),
      CharacterCount,
      Collaboration.configure({
        document: doc,
      }),
      CollaborationCaret.configure({
        provider: provider,
        user: getUserInfo(),
        render: (user: { name: string; color: string }) => {
          // Check if this cursor belongs to the current user (by matching name)
          // Ideally we would match by ID, but name is what we have readily available in this scope
          // and "ghost" cursors usually have the same name.
          const currentUser = getUserInfo();
          if (user.name === currentUser.name) {
            const hiddenSpan = document.createElement("span");
            hiddenSpan.style.display = "none";
            return hiddenSpan;
          }

          const cursor = document.createElement("span");
          cursor.classList.add("collaboration-cursor__caret");
          cursor.setAttribute("style", `border-color: ${user.color}`);

          const label = document.createElement("div");
          label.classList.add("collaboration-cursor__label");
          label.setAttribute("style", `background-color: ${user.color}`);
          label.insertBefore(document.createTextNode(user.name), null);
          cursor.insertBefore(label, null);

          return cursor;
        },
      }),
    ],
    editable,
    editorProps: {
      attributes: {
        class: "tiptap p-8 min-h-full focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && provider && doc) {
      editor.setEditable(!!editable && isConnected && synced);
    }
  }, [editor, provider, doc, editable, isConnected, synced]);

  if (!editor) {
    return null;
  }

  return (
    <>
      <EditorContent editor={editor} className="h-full" />
      <FloatingToolbar editor={editor} />
    </>
  );
};
