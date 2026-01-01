import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Crown,
  Settings,
  Link,
  Trash2,
  LogOut,
  MessageSquare,
  MoreVertical,
} from "lucide-react";
import { Room } from "@/types/room.types";
import { startTransition } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConnectionStatusProps {
  status: "connected" | "connecting" | "disconnected" | "reconnecting";
}

interface RoomHeaderProps {
  roomId: string;
  room: Room;
  isOwner: boolean;
  canManage: boolean;
  socketStatus: "connected" | "connecting" | "disconnected" | "reconnecting";
  onBack: () => void;
  onToggleChat: () => void;
  onSettings: () => void;
  onOpenInviteModal: () => void;
  setConfirmDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      title: string;
      description: string;
      confirmText: string;
      variant: "default" | "destructive";
      onConfirm: () => void;
    } | null>
  >;
}

const ConnectionStatus = ({ status }: ConnectionStatusProps) => {
  const statusColors = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500",
    disconnected: "bg-red-500",
    reconnecting: "bg-primary",
  };

  const statusLabels = {
    connected: "Live",
    connecting: "Connecting...",
    disconnected: "Offline",
    reconnecting: "Reconnecting...",
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`h-2 w-2 rounded-full ${statusColors[status]} ${
          status === "connected" ? "animate-pulse" : ""
        }`}
      />
      <span className="text-muted-foreground">{statusLabels[status]}</span>
    </div>
  );
};

export const RoomHeader = ({
  roomId,
  room,
  isOwner,
  canManage,
  socketStatus,
  onBack,
  onToggleChat,
  onSettings,
  onOpenInviteModal,
  setConfirmDialog,
}: RoomHeaderProps) => {
  const router = useRouter();

  const handleDelete = async () => {
    setConfirmDialog(null);
    try {
      await axios.delete(`/api/rooms/${roomId}`);
      toast.success("Room deleted successfully");
      startTransition(() => {
        router.push("/rooms");
      });
    } catch {
      toast.error("Failed to delete room");
    }
  };

  const handleLeave = async () => {
    setConfirmDialog(null);
    try {
      await axios.post(`/api/rooms/${roomId}/leave`);
      toast.success("Left room successfully");
      startTransition(() => {
        router.push("/rooms");
      });
    } catch {
      toast.error("Failed to leave room");
    }
  };

  const onDelete = () =>
    setConfirmDialog({
      open: true,
      title: "Delete Room",
      description:
        "Are you sure you want to delete this room? This action cannot be undone and all participants will be removed.",
      confirmText: "Delete Room",
      variant: "destructive",
      onConfirm: handleDelete,
    });

  const onLeave = () =>
    setConfirmDialog({
      open: true,
      title: "Leave Room",
      description:
        "Are you sure you want to leave this room? You can rejoin later using the room code.",
      confirmText: "Leave Room",
      variant: "default",
      onConfirm: handleLeave,
    });

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="-ml-2 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate max-w-[200px] sm:max-w-md md:max-w-xl">
              {room.name}
            </h1>
            {isOwner && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium shrink-0">
                <Crown className="h-4 w-4" />
                <span className="hidden xs:inline">Owner</span>
              </div>
            )}
            <div className="shrink-0">
              <ConnectionStatus status={socketStatus} />
            </div>
          </div>
          <p className="text-muted-foreground ml-10 truncate max-w-md">
            {room.description || "No description provided"}
          </p>
        </div>

        <div className="flex gap-1 items-center shrink-0 mt-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onToggleChat}>
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Chat</p>
              </TooltipContent>
            </Tooltip>

            {canManage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={onOpenInviteModal}
                    size="icon"
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send Invites</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canManage && (
                <>
                  <DropdownMenuItem onClick={onSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {isOwner ? (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Room</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onLeave}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Leave Room</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
