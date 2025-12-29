"use client";

import { useYjs } from "@/contexts/YjsContext";
import "@/styles/monaco.css";
import Editor, { OnMount } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useEffect, useRef } from "react";

interface CodeEditorProps {
  language?: string;
  theme?: "vs-dark" | "light";
  onLanguageChange?: (language: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language = "typescript",
  theme = "vs-dark",
}) => {
  const { doc, provider } = useYjs();
  const { data: user } = useSession();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const bindingRef = useRef<{ destroy: () => void } | null>(null);

  const customTheme = theme === "vs-dark" ? "app-dark" : "app-light";

  const handleBeforeMount = (monaco: Parameters<OnMount>[1]) => {
    monaco.editor.defineTheme("app-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0a0a0a", // Match dark mode background
        "editor.foreground": "#e4e4e7", // Match foreground text
        "editorLineNumber.foreground": "#71717a",
        "editorLineNumber.activeForeground": "#a1a1aa",
        "editor.lineHighlightBackground": "#18181b",
        "editor.selectionBackground": "#27272a",
        "editor.inactiveSelectionBackground": "#27272a80",
      },
    });

    monaco.editor.defineTheme("app-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#ffffff", // Match light mode background
        "editor.foreground": "#09090b", // Match foreground text
        "editorLineNumber.foreground": "#a1a1aa",
        "editorLineNumber.activeForeground": "#71717a",
        "editor.lineHighlightBackground": "#f4f4f5",
        "editor.selectionBackground": "#e4e4e7",
        "editor.inactiveSelectionBackground": "#e4e4e780",
      },
    });
  };

  const handleEditorDidMount: OnMount = async (editor) => {
    editorRef.current = editor;

    // Dynamically import MonacoBinding to avoid SSR issues
    const { MonacoBinding } = await import("y-monaco");

    if (doc && provider) {
      // Get or create the shared text type for Monaco
      const yText = doc.getText("monaco-content");

      // Create Monaco binding with Yjs - this automatically handles remote cursors
      const binding = new MonacoBinding(
        yText,
        editor.getModel()!,
        new Set([editor]),
        provider.awareness
      );

      bindingRef.current = binding;

      // Add custom styling for remote cursors with user colors
      const style = document.createElement("style");
      style.id = "monaco-cursor-colors";

      // Listen to awareness changes to update cursor colors
      const updateCursorColors = () => {
        const states = provider.awareness.getStates();
        let css = "";

        states.forEach((state: { user?: { color?: string; name?: string; id?: string } }, clientId: number) => {
          if (state.user?.color && state.user?.id !== user?.user?._id) {
            const userName = state.user?.name || "Anonymous";
            css += `
              .yRemoteSelection-${clientId} {
                background-color: ${state.user.color}40 !important;
              }
              .yRemoteSelectionHead-${clientId} {
                position: relative;
          
                margin-left: -2px;
                margin-right: -2px;
              }
              .yRemoteSelectionHead-${clientId}::after {
                content: "${userName}";
                position: absolute;
                top: -1.4em;
                left: -2px;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.2;
                white-space: nowrap;
                color: white;
                background-color: ${state.user.color};
                padding: 2px 6px;
                border-radius: 4px 4px 4px 0;
                pointer-events: none;
                user-select: none;
                z-index: 1000;
              }
            `;
          }
        });

        style.textContent = css;
      };

      // Update colors on awareness changes
      provider.awareness.on("change", updateCursorColors);
      updateCursorColors();

      // Append style to document head
      if (!document.getElementById("monaco-cursor-colors")) {
        document.head.appendChild(style);
      }

      // Focus editor after mounting
      editor.focus();
    }
  };

  // Cleanup binding on unmount
  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }

      // Remove custom cursor color styles
      const style = document.getElementById("monaco-cursor-colors");
      if (style) {
        style.remove();
      }
    };
  }, []);

  // Update language when prop changes
  useEffect(() => {
    if (editorRef.current && language) {
      const model = editorRef.current.getModel();
      if (model) {
        const monacoGlobal = (window as { monaco?: { editor: { setModelLanguage: (model: unknown, languageId: string) => void } } }).monaco;
        if (monacoGlobal) {
          monacoGlobal.editor.setModelLanguage(model, language);
        }
      }
    }
  }, [language]);

  // Update theme when it changes
  useEffect(() => {
    if (editorRef.current) {
      const monaco = (window as { monaco?: { editor: { setTheme: (themeName: string) => void } } }).monaco;
      if (monaco) {
        monaco.editor.setTheme(customTheme);
      }
    }
  }, [customTheme]);

  if (!doc || !provider) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/20 border">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Initializing editor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full border overflow-hidden bg-background">
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        theme={customTheme}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          wordWrap: "on",
          automaticLayout: true,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          renderWhitespace: "selection",
          tabSize: 2,
          insertSpaces: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
      />
    </div>
  );
};
