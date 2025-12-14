"use client";

import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/contexts/SocketContext";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        <SocketProvider>{children}</SocketProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
