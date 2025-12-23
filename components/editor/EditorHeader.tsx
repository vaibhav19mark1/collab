import { Editor } from "@tiptap/react";
import { WebsocketProvider } from "y-websocket";
import { PanelLeft, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Participant as RoomParticipant } from "@/types/room.types";
import { useUIStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";

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
  const { data: session } = useSession();
  const [activeUserIds, setActiveUserIds] = useState<Set<string>>(new Set());
  const toggleChat = useUIStore((s) => s.toggleChat);
  const unreadCount = useChatStore((s) => s.unreadCountsByRoom[roomId] || 0);

  useEffect(() => {
    if (!provider) return;

    const updateActiveUsers = () => {
      const states = provider.awareness.getStates();
      const active = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      states.forEach((state: any) => {
        if (state.user?.id) {
          active.add(state.user.id);
        }
      });
      setActiveUserIds(active);
    };

    updateActiveUsers();
    provider.awareness.on("change", updateActiveUsers);

    return () => {
      provider.awareness.off("change", updateActiveUsers);
    };
  }, [provider]);

  if (!editor) return null;

  const wordCount = editor.storage.characterCount.words();
  const charCount = editor.storage.characterCount.characters();
  const activeUsers = participants.filter((p) => activeUserIds.has(p.userId));
  const displayParticipants = activeUsers.slice(0, 3);
  const remainingParticipants = Math.max(0, activeUsers.length - 3);

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
          <div className="flex -space-x-2">
            {displayParticipants.map((participant) => {
              const isActive = activeUserIds.has(participant.userId);
              const initials = participant.username
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <TooltipProvider key={participant.userId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-background cursor-pointer transition-transform hover:z-10 hover:scale-110">
                        <AvatarImage
                          src={
                            participant.userId === session?.user?._id
                              ? (session?.user?.image as string)
                              : participant.avatar
                          }
                          alt={participant.username}
                        />
                        <AvatarFallback
                          className="text-xs"
                          style={{
                            backgroundColor: participant.color || "#000",
                            color: "white",
                          }}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{participant.username}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
            {remainingParticipants > 0 && (
              <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium z-10">
                +{remainingParticipants}
              </div>
            )}
          </div>

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

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/rooms/${roomId}`}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Back to Room</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
