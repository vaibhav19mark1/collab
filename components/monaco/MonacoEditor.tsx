"use client";

import { useYjs } from "@/contexts/YjsContext";
import { Participant } from "@/types/room.types";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CodeEditor } from "./CodeEditor";
import { MonacoToolbar } from "./MonacoToolbar";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

interface MonacoEditorProps {
  documentTitle?: string;
  initialLanguage?: string;
  theme: "vs-dark" | "light";
  enableToolbar?: boolean;
  enableDownload?: boolean;
  enableCopy?: boolean;
  roomId: string;
  participants?: Participant[];
  className?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  documentTitle,
  initialLanguage = "typescript",
  theme,
  enableToolbar = true,
  enableDownload = true,
  enableCopy = true,
  roomId,
  participants = [],
  className = "",
}) => {
  const { doc, provider, isConnected, synced } = useYjs();
  const [language, setLanguage] = useState(initialLanguage);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync language across all clients using Yjs Map
  useEffect(() => {
    if (!doc) return;

    const yMeta = doc.getMap("monaco-metadata");

    // Set initial language if not already set
    if (!yMeta.has("language")) {
      yMeta.set("language", initialLanguage);
    } else {
      const storedLanguage = yMeta.get("language") as string;
      if (storedLanguage) {
        setLanguage(storedLanguage);
      }
    }

    // Listen for language changes from other clients
    const observer = () => {
      const newLanguage = yMeta.get("language") as string;
      if (newLanguage && newLanguage !== language) {
        setLanguage(newLanguage);
      }
    };

    yMeta.observe(observer);

    return () => {
      yMeta.unobserve(observer);
    };
  }, [doc, initialLanguage, language]);

  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      if (!doc) return;

      const yMeta = doc.getMap("monaco-metadata");
      yMeta.set("language", newLanguage);
      setLanguage(newLanguage);
      toast.success(
        `Language changed to ${
          SUPPORTED_LANGUAGES.find((l) => l.id === newLanguage)?.name
        }`
      );
    },
    [doc]
  );

  const handleDownload = useCallback(() => {
    if (!doc) return;

    const yText = doc.getText("monaco-content");
    const content = yText.toString();
    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.id === language);
    const extension = langInfo?.extension || ".txt";
    const filename = documentTitle
      ? `${documentTitle}${extension}`
      : `code${extension}`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Code downloaded successfully");
  }, [doc, language, documentTitle]);

  const handleCopy = useCallback(async () => {
    if (!doc) return;

    const yText = doc.getText("monaco-content");
    const content = yText.toString();

    try {
      await navigator.clipboard.writeText(content);
      toast.success("Code copied to clipboard");
    } catch {
      toast.error("Failed to copy code");
    }
  }, [doc]);

  const handleReset = useCallback(() => {
    if (!doc) return;

    const yText = doc.getText("monaco-content");
    // Clear the content by deleting all text
    doc.transact(() => {
      yText.delete(0, yText.length);
    });

    toast.success("Code reset");
  }, [doc]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <div
      className={`flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50 bg-background" : "h-full"
      } ${className}`}
    >
      {enableToolbar && (
        <MonacoToolbar
          language={language}
          onLanguageChange={handleLanguageChange}
          onDownload={enableDownload ? handleDownload : undefined}
          onCopy={enableCopy ? handleCopy : undefined}
          onReset={handleReset}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          disabled={!isConnected || !synced}
          documentTitle={documentTitle}
          roomId={roomId}
          participants={participants}
          provider={provider}
          isConnected={isConnected}
        />
      )}

      <div className="flex-1 min-h-0">
        <CodeEditor language={language} theme={theme} />
      </div>
    </div>
  );
};
