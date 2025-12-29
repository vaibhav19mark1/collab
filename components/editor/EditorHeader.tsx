import { Editor } from "@tiptap/react";
import { WebsocketProvider } from "y-websocket";
import { PanelLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Participant as RoomParticipant } from "@/types/room.types";
import { useUIStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";
import { ActiveUsers } from "@/components/shared/ActiveUsers";
import { BackToRoomButton } from "@/components/shared/BackToRoomButton";

interface Participant extends RoomParticipant {
  color?: string;
}

interface EditorHeaderProps {
  editor: Editor | null;
  provider: WebsocketProvider | null;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isConnected: boolean;
  documentTitle: string;
  roomId: string;
  participants?: Participant[];
}

export const EditorHeader = ({
  editor,
  provider,
  isSidebarOpen,
  toggleSidebar,
  isConnected,
  documentTitle,
  roomId,
  participants = [],
}: EditorHeaderProps) => {
  const toggleChat = useUIStore((s) => s.toggleChat);
  const unreadCount = useChatStore((s) => s.unreadCountsByRoom[roomId] || 0);

  if (!editor) return null;

  const wordCount = editor.storage.characterCount.words();
  const charCount = editor.storage.characterCount.characters();

  return (
    <div className="h-16 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className={isSidebarOpen ? "bg-muted" : ""}
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Sidebar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex flex-col">
          <h1 className="text-sm font-semibold truncate max-w-50 sm:max-w-75">
            {documentTitle}
          </h1>
          <span className="text-xs text-muted-foreground">
            {isConnected ? "Saved" : "Unsaved changes"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex flex-col items-end text-muted-foreground text-xs">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>

        <div className="flex items-center gap-4 border-l pl-4 h-8">
          <ActiveUsers
            provider={provider}
            participants={participants}
            maxDisplay={3}
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleChat}
                  className="relative"
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <BackToRoomButton roomId={roomId} />
        </div>
      </div>
    </div>
  );
};
