"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Lock,
  Crown,
  LogOut,
  Trash2,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { Room } from "@/types/room.types";
import { toast } from "sonner";

interface RoomCardProps {
  room: Room;
  currentUserId: string;
  onDelete?: () => void;
  onLeave?: () => void;
}

export function RoomCard({
  room,
  currentUserId,
  onDelete,
  onLeave,
}: RoomCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const isOwner = room.owner === currentUserId;
  const participantCount = room.participants.length;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(room.roomCode);
    toast.success("Room code copied to clipboard!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/rooms/${room._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete room");
      }

      onDelete?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete room");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this room?")) return;

    setIsLeaving(true);
    try {
      const response = await fetch(`/api/rooms/${room._id}/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to leave room");
      }

      onLeave?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to leave room");
    } finally {
      setIsLeaving(false);
    }
  };

  const formatRoomCode = (code: string) => {
    return code.match(/.{1,3}/g)?.join("-") || code;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{room.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {room.description || "No description"}
            </CardDescription>
          </div>
          {isOwner && (
            <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full text-xs font-medium">
              <Crown className="h-3 w-3" />
              <span>Owner</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Room Code */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              Room Code
            </p>
            <p className="font-mono text-lg font-bold tracking-wider">
              {formatRoomCode(room.roomCode)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className="h-8 w-8 p-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Room Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>
              {participantCount}/{room.maxParticipants}
            </span>
          </div>
          {room.isPrivate && (
            <div className="flex items-center gap-1.5">
              <Lock className="h-4 w-4" />
              <span>Private</span>
            </div>
          )}
          <div className="ml-auto text-xs">{formatDate(room.lastActivity)}</div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => router.push(`/rooms/${room._id}`)}
        >
          Open Room
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {isOwner ? (
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={handleLeave}
            disabled={isLeaving}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
