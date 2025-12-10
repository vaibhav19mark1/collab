import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Crown,
  Settings,
  Link,
  Check,
  Loader2,
  Trash2,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { Room } from "@/types/room.types";
import { startTransition } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ConnectionStatusProps {
  status: "connected" | "connecting" | "disconnected" | "reconnecting";
}

interface RoomHeaderProps {
  roomId: string;
  room: Room;
  isOwner: boolean;
  canManage: boolean;
  socketStatus: "connected" | "connecting" | "disconnected" | "reconnecting";
  isGeneratingInvite: boolean;
  copiedInvite: boolean;
  onBack: () => void;
  onToggleChat: () => void;
  onSettings: () => void;
  onGenerateInvite: () => void;
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
    reconnecting: "bg-blue-500",
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
  isGeneratingInvite,
  copiedInvite,
  onBack,
  onToggleChat,
  onSettings,
  onGenerateInvite,
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
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{room.name}</h1>
            {isOwner && (
              <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-medium">
                <Crown className="h-4 w-4" />
                <span>Owner</span>
              </div>
            )}
            <ConnectionStatus status={socketStatus} />
          </div>
          <p className="text-muted-foreground">
            {room.description || "No description provided"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleChat}
            title="Toggle Chat"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          {canManage && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={onSettings}
                title="Room Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={onGenerateInvite}
                disabled={isGeneratingInvite}
              >
                {isGeneratingInvite ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : copiedInvite ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Link className="mr-2 h-4 w-4" />
                )}
                {copiedInvite ? "Link Copied!" : "Copy Invite Link"}
              </Button>
            </>
          )}
          {isOwner ? (
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Room
            </Button>
          ) : (
            <Button variant="outline" onClick={onLeave}>
              <LogOut className="mr-2 h-4 w-4" />
              Leave Room
            </Button>
          )}
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
