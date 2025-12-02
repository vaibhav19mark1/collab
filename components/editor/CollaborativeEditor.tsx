"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useYjs } from "@/contexts/YjsContext";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { EditorToolbar } from "./EditorToolbar";

interface CollaborativeEditorProps {
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

const TiptapEditor = ({
  doc,
  provider,
  placeholder,
  editable,
  className,
  isConnected,
  synced,
}: CollaborativeEditorProps & {
  doc: any;
  provider: any;
  isConnected: boolean;
  synced: boolean;
}) => {
  // Get user info from provider awareness
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
        // @ts-ignore - history option exists but types are strict
        history: false,
      }),
      Collaboration.configure({
        document: doc,
      }),
      CollaborationCaret.configure({
        provider: provider,
        user: getUserInfo(),
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
    ],
    editable,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[400px] max-w-none p-6",
      },
    },
  });

  useEffect(() => {
    if (editor && provider && doc) {
      editor.setEditable(!!editable && isConnected && synced);
    }
  }, [editor, provider, doc, editable, isConnected, synced]);

  return (
    <div className={`border rounded-lg bg-background ${className}`}>
      <div className="border-b">
        <EditorToolbar editor={editor} />
      </div>
      <div className="border-b p-2 bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <span>
            {isConnected ? (
              synced ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Syncing...
                </span>
              )
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Disconnected
              </span>
            )}
          </span>
          <span>
            {editor?.storage.characterCount.characters() || 0} characters
          </span>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

const CollaborativeEditor = ({
  placeholder = "Start typing...",
  editable = true,
  className = "",
}: CollaborativeEditorProps) => {
  const { provider, doc, isConnected, synced } = useYjs();

  if (!provider || !doc) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TiptapEditor
      placeholder={placeholder}
      editable={editable}
      className={className}
      doc={doc}
      provider={provider}
      isConnected={isConnected}
      synced={synced}
    />
  );
};

export default CollaborativeEditor;
