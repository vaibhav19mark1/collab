"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface WhiteboardProps {
  className?: string;
  [key: string]: unknown;
}

export const Whiteboard = ({ className = "", ...props }: WhiteboardProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`h-full w-full ${className}`}>
      <Excalidraw
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        {...props}
      />
    </div>
  );
};

Whiteboard.displayName = "Whiteboard";
