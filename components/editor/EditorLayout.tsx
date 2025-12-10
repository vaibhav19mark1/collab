import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EditorLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  header: ReactNode;
  isSidebarOpen: boolean;
}

export const EditorLayout = ({
  children,
  sidebar,
  header,
  isSidebarOpen,
}: EditorLayoutProps) => {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex-none z-50">{header}</div>
      <div className="flex flex-1 overflow-hidden relative">
        <div
          className={cn(
            "flex-none border-r bg-muted/10 transition-all duration-300 ease-in-out overflow-y-auto",
            isSidebarOpen ? "w-64" : "w-0 opacity-0 overflow-hidden"
          )}
        >
          {sidebar}
        </div>
        <div className="flex-1 overflow-y-auto relative bg-background scroll-smooth">
          {children}
        </div>
      </div>
    </div>
  );
};
