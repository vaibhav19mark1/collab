"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, redirect } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { Room } from "@/types/room.types";
import { toast } from "sonner";
import { RoomSettingsModal } from "@/components/RoomSettingsModal";
import RoomChat from "@/components/RoomChat";
import { Documents } from "@/components/room/document/Documents";
import { useUIStore } from "@/stores/uiStore";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { useRoomStateUpdates } from "@/hooks/useRoomStateUpdates";
import { RoomHeader } from "@/components/room/RoomHeader";
import { RoomInfoCard } from "@/components/room/RoomInfoCard";
import { ParticipantsCard } from "@/components/room/ParticipantsCard";
import { BannedUsersCard } from "@/components/room/BannedUsersCard";
import type {
  RoomDeletedPayload,
  ParticipantKickedPayload,
  ParticipantBannedPayload,
} from "@/types/socket.types";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function RoomDetailsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: "default" | "destructive";
    onConfirm: () => void;
  } | null>(null);

  const setActiveRoomId = useUIStore((s) => s.setActiveRoomId);
  const socketStatus = useUIStore((s) => s.socketStatus);
  const toggleChat = useUIStore((s) => s.toggleChat);

  const {
    owner: roomOwner = "",
    roomCode = "",
    participants = [],
    name: roomName = "",
    description = "",
    isPrivate = false,
    bannedUsers = [],
    maxParticipants = 0,
    hasPassword = false,
  } = room || {};

  // Custom hook for optimistic state updates

  const {
    handleParticipantJoined,
    handleParticipantLeft,
    handleParticipantKicked: handleParticipantKickedState,
    handleParticipantBanned: handleParticipantBannedState,
    handleParticipantUnbanned,
    handleRoleChanged,
    handleSettingsUpdated,
  } = useRoomStateUpdates(setRoom);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  const fetchRoom = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/rooms/${roomId}`);
      setRoom(response.data.room);
    } catch (error) {
      console.error("Error fetching room:", error);
      router.push("/rooms");
    } finally {
      setIsLoading(false);
    }
  }, [roomId, router]);

  // Initial fetch and active room setup

  useEffect(() => {
    if (status === "authenticated" && roomId) {
      fetchRoom();
      setActiveRoomId(roomId);
    }
    return () => setActiveRoomId(null);
  }, [status, roomId, fetchRoom, setActiveRoomId]);

  const handleParticipantKickedSocket = useCallback(
    (payload: ParticipantKickedPayload) => {
      if (payload.kickedUserId === session?.user?._id) {
        startTransition(() => {
          router.push("/rooms");
        });
      } else {
        handleParticipantKickedState(payload);
      }
    },
    [session, router, handleParticipantKickedState]
  );

  const handleParticipantBannedSocket = useCallback(
    (payload: ParticipantBannedPayload) => {
      if (payload.bannedUserId === session?.user?._id) {
        startTransition(() => {
          router.push("/rooms");
        });
      } else {
        handleParticipantBannedState(payload);
      }
    },
    [session, router, handleParticipantBannedState]
  );

  const handleRoomDeleted = useCallback(
    (payload: RoomDeletedPayload) => {
      if (payload.performedBy === session?.user?._id) return;
      startTransition(() => {
        router.push("/rooms");
      });
    },
    [router, session]
  );

  useRoomSocket({
    roomId,
    userId: session?.user?._id || "",
    username: session?.user?.username as string,
    onParticipantJoined: handleParticipantJoined,
    onParticipantLeft: handleParticipantLeft,
    onParticipantKicked: handleParticipantKickedSocket,
    onParticipantBanned: handleParticipantBannedSocket,
    onParticipantUnbanned: handleParticipantUnbanned,
    onRoleChanged: handleRoleChanged,
    onSettingsUpdated: handleSettingsUpdated,
    onRoomDeleted: handleRoomDeleted,
  });

  const handleGenerateInviteLink = async (email?: string) => {
    setIsGeneratingInvite(true);
    try {
      const response = await axios.post(`/api/rooms/${roomId}/invite`, {
        expiryDays: 7,
        inviteeEmail: email,
      });

      const inviteUrl = response.data.inviteUrl;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);

      if (response.data.emailSent) {
        toast.success(`Invite link copied and email sent to ${email}!`);
      } else {
        toast.success("Invite link copied to clipboard!");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error || "Failed to generate invite link"
        );
      } else {
        toast.error("Failed to generate invite link");
      }
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session || !room) {
    return null;
  }

  const handleSettingsUpdate = (updates: {
    name: string;
    description?: string;
    isPrivate: boolean;
    maxParticipants: number;
  }) => {
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        name: updates.name,
        description: updates.description || "",
        isPrivate: updates.isPrivate,
        maxParticipants: updates.maxParticipants,
        lastActivity: new Date(),
      };
    });
  };

  const isOwner = roomOwner === session.user._id;
  const { role: currentUserRole } =
    participants.find((p) => p.userId === session.user._id) || {};
  const isAdmin = currentUserRole === "admin";
  const canManage = isOwner || isAdmin;

  return (
    <div className="container mx-auto px-4 py-8">
      <RoomHeader
        roomId={roomId}
        room={room}
        isOwner={isOwner}
        canManage={canManage}
        socketStatus={socketStatus}
        isGeneratingInvite={isGeneratingInvite}
        copiedInvite={copiedInvite}
        onBack={() => router.push("/rooms")}
        onToggleChat={toggleChat}
        onSettings={() => setShowSettingsDialog(true)}
        onGenerateInvite={() => handleGenerateInviteLink()}
        setConfirmDialog={setConfirmDialog}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <RoomInfoCard room={room} copied={copied} onCopyCode={handleCopyCode} />
        <ParticipantsCard
          roomId={roomId}
          participants={participants}
          currentUserId={session.user._id}
          isOwner={isOwner}
          canManage={canManage}
          setConfirmDialog={setConfirmDialog}
        />
      </div>

      {canManage && (
        <BannedUsersCard roomId={roomId} bannedUsers={bannedUsers || []} />
      )}

      {/* Collaborative Documents */}
      <Documents
        roomId={roomId}
        userId={session.user._id}
        username={session.user.username as string}
      />

      {/* Room Settings Modal */}
      {room && canManage && showSettingsDialog && (
        <RoomSettingsModal
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          roomId={roomId}
          currentSettings={{
            name: roomName,
            description,
            isPrivate,
            hasPassword,
            maxParticipants,
          }}
          onSettingsUpdated={handleSettingsUpdate}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => !open && setConfirmDialog(null)}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText={confirmDialog.confirmText}
          cancelText="Cancel"
          onConfirm={confirmDialog.onConfirm}
          variant={confirmDialog.variant}
        />
      )}

      <RoomChat roomId={roomId} />
    </div>
  );
}
