"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Lock,
  Crown,
  Copy,
  Check,
  ArrowLeft,
  Trash2,
  LogOut,
  Loader2,
  Settings,
  Calendar,
} from "lucide-react";
import { Room, Participant } from "@/types/room.types";
import { toast } from "sonner";

export default function RoomDetailsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && roomId) {
      fetchRoom();
    }
  }, [status, roomId]);

  const fetchRoom = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/rooms");
          return;
        }
        throw new Error("Failed to fetch room");
      }

      const data = await response.json();
      setRoom(data.room);
    } catch (error) {
      console.error("Error fetching room:", error);
      router.push("/rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this room? This cannot be undone."
      )
    )
      return;

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete room");
      }

      router.push("/rooms");
    } catch (error) {
      toast.error("Failed to delete room");
    }
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this room?")) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to leave room");
      }

      router.push("/rooms");
    } catch (error) {
      toast.error("Failed to leave room");
    }
  };

  const formatRoomCode = (code: string) => {
    return code.match(/.{1,3}/g)?.join("-") || code;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
      case "admin":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session || !room) {
    return null;
  }

  const isOwner = room.owner === session.user._id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/rooms")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rooms
        </Button>

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
            </div>
            <p className="text-muted-foreground">
              {room.description || "No description provided"}
            </p>
          </div>

          <div className="flex gap-2">
            {isOwner ? (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Room
              </Button>
            ) : (
              <Button variant="outline" onClick={handleLeave}>
                <LogOut className="mr-2 h-4 w-4" />
                Leave Room
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Room Information */}
        <Card>
          <CardHeader>
            <CardTitle>Room Information</CardTitle>
            <CardDescription>
              Details about this collaboration room
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Room Code */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">
                  Room Code
                </p>
                <p className="font-mono text-2xl font-bold tracking-wider">
                  {formatRoomCode(room.roomCode)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-9 w-9 p-0"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Participants</span>
                </div>
                <span className="font-medium">
                  {room.participants.length} / {room.maxParticipants}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm">Privacy</span>
                </div>
                <span className="font-medium">
                  {room.isPrivate ? "Private" : "Public"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Created</span>
                </div>
                <span className="font-medium">
                  {new Date(room.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Last Activity</span>
                </div>
                <span className="font-medium">
                  {new Date(room.lastActivity).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>
              {room.participants.length} member
              {room.participants.length !== 1 ? "s" : ""} in this room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
              {room.participants.map((participant: Participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{participant.username}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined{" "}
                        {new Date(participant.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                      participant.role
                    )}`}
                  >
                    {participant.role}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collaboration Tools Placeholder */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Collaboration Tools</CardTitle>
          <CardDescription>
            Real-time collaboration features coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-6 border rounded-lg text-center opacity-50">
              <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Text Editor</p>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </div>
            <div className="p-6 border rounded-lg text-center opacity-50">
              <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Code Editor</p>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </div>
            <div className="p-6 border rounded-lg text-center opacity-50">
              <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Whiteboard</p>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
