import {
  ParticipantBannedPayload,
  ParticipantJoinedPayload,
  ParticipantKickedPayload,
  ParticipantLeftPayload,
  ParticipantRoleChangedPayload,
  ParticipantUnbannedPayload,
  RoomDeletedPayload,
  RoomSettingsUpdatedPayload,
} from "@/types/socket.types";
import { useSocket } from "./useSocket";
import { useUIStore } from "@/stores/uiStore";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface UseRoomSocketOptions {
  roomId: string;
  userId: string;
  username?: string;
  onParticipantJoined?: (payload: ParticipantJoinedPayload) => void;
  onParticipantLeft?: (payload: ParticipantLeftPayload) => void;
  onParticipantKicked?: (payload: ParticipantKickedPayload) => void;
  onParticipantBanned?: (payload: ParticipantBannedPayload) => void;
  onParticipantUnbanned?: (payload: ParticipantUnbannedPayload) => void;
  onRoleChanged?: (payload: ParticipantRoleChangedPayload) => void;
  onSettingsUpdated?: (payload: RoomSettingsUpdatedPayload) => void;
  onRoomDeleted?: (payload: RoomDeletedPayload) => void;
}

export const useRoomSocket = ({
  roomId,
  userId,
  username,
  onParticipantJoined,
  onParticipantLeft,
  onParticipantKicked,
  onParticipantBanned,
  onParticipantUnbanned,
  onRoleChanged,
  onSettingsUpdated,
  onRoomDeleted,
}: UseRoomSocketOptions) => {
  const { socket, isConnected, emit, on, off } = useSocket();
  const notificationPreferences = useUIStore(
    (state) => state.notificationPreferences
  );
  const { showJoinLeave, mute, showKickBan } = notificationPreferences;
  const hadJoinedRef = useRef(false);

  // Join room on mount
  useEffect(() => {
    if (!isConnected || !roomId || hadJoinedRef.current) return;
    emit("room:join", roomId, username ? { userId, username } : undefined);
    hadJoinedRef.current = true;

    return () => {
      if (hadJoinedRef.current) {
        emit("room:leave", roomId);
        hadJoinedRef.current = false;
      }
    };
  }, [isConnected, roomId, userId, username, emit]);

  // Participant joined handler
  useEffect(() => {
    if (!socket) return;

    const handleParticipantJoined = (payload: ParticipantJoinedPayload) => {
      if (payload.participant.userId === userId) {
        return; // ignore self
      }
      if (showJoinLeave && !mute) {
        toast.info(`${payload.participant.username} joined the room`);
      }
      onParticipantJoined?.(payload);
    };

    on("participant:joined", handleParticipantJoined);
    return () => off("participant:joined", handleParticipantJoined);
  }, [socket, userId, showJoinLeave, mute, onParticipantJoined]);

  // Participant left handler
  useEffect(() => {
    if (!socket) return;

    const handleParticipantLeft = (payload: ParticipantLeftPayload) => {
      if (payload.userId === userId) return; // ignore self
      if (showJoinLeave && !mute) {
        toast.info(`${payload.username} left the room`);
      }
      onParticipantLeft?.(payload);
    };

    on("participant:left", handleParticipantLeft);
    return () => off("participant:left", handleParticipantLeft);
  }, [socket, userId, showJoinLeave, mute, onParticipantLeft]);

  // Participant kicked handler
  useEffect(() => {
    if (!socket) return;

    const handleParticipantKicked = (payload: ParticipantKickedPayload) => {
      if (payload.kickedUserId === userId) {
        toast.error(
          `You have been kicked from the room by ${payload.kickedByUsername}`,
          { duration: 5000 }
        );
        onParticipantKicked?.(payload);
      } else if (showKickBan && !mute) {
        // Don't show toast if we performed the action (API already showed success toast)
        if (payload.performedBy === userId) {
          onParticipantKicked?.(payload);
          return;
        }
        toast.warning(
          `${payload.kickedUsername} was kicked by ${payload.kickedByUsername}`,
          { duration: 3000 }
        );
        onParticipantKicked?.(payload);
      }
    };
    on("participant:kicked", handleParticipantKicked);
    return () => off("participant:kicked", handleParticipantKicked);
  }, [socket, userId, showKickBan, mute, onParticipantKicked]);

  // Participant banned handler
  useEffect(() => {
    if (!socket) return;

    const handleParticipantBanned = (payload: ParticipantBannedPayload) => {
      if (payload.bannedUserId === userId) {
        const reason = payload.reason ? ` Reason: ${payload.reason}` : "";
        toast.error(
          `You were banned from the room by ${payload.bannedByUsername}.${reason}`,
          { duration: 5000 }
        );
        onParticipantBanned?.(payload);
      } else if (showKickBan && !mute) {
        // Don't show toast if we performed the action (API already showed success toast)
        if (payload.performedBy === userId) {
          onParticipantBanned?.(payload);
          return;
        }
        toast.warning(
          `${payload.bannedUsername} was banned by ${payload.bannedByUsername}`,
          { duration: 3000 }
        );
        onParticipantBanned?.(payload);
      }
    };

    on("participant:banned", handleParticipantBanned);
    return () => off("participant:banned", handleParticipantBanned);
  }, [socket, userId, notificationPreferences, onParticipantBanned]);

  // Participant unbanned handler
  useEffect(() => {
    if (!socket) return;

    const handleParticipantUnbanned = (payload: ParticipantUnbannedPayload) => {
      // Don't show toast if we performed the action (API already showed success toast)
      if (payload.performedBy === userId) {
        onParticipantUnbanned?.(payload);
        return;
      }

      if (!mute) {
        toast.info(
          `${payload.unbannedUsername} was unbanned by ${payload.unbannedByUsername}`,
          { duration: 3000 }
        );
      }
      onParticipantUnbanned?.(payload);
    };

    on("participant:unbanned", handleParticipantUnbanned);
    return () => off("participant:unbanned", handleParticipantUnbanned);
  }, [socket, mute, onParticipantUnbanned]);

  // Role changed handler
  useEffect(() => {
    if (!socket) return;

    const handleRoleChange = (payload: ParticipantRoleChangedPayload) => {
      if (payload.userId === userId) {
        toast.info(
          `Your role was changed to ${payload.newRole} by ${payload.changedByUsername}`,
          {
            duration: 4000,
          }
        );
      } else if (!mute) {
        // Don't show toast if we performed the action (API already showed success toast)
        if (payload.performedBy === userId) {
          onRoleChanged?.(payload);
          return;
        }
        toast.info(
          `${payload.username}'s role changed from ${payload.oldRole} to ${payload.newRole}`,
          { duration: 3000 }
        );
      }
      onRoleChanged?.(payload);
    };

    on("participant:role_changed", handleRoleChange);
    return () => off("participant:role_changed", handleRoleChange);
  }, [socket, userId, mute, onRoleChanged]);

  // Settings updated handler
  useEffect(() => {
    if (!socket) return;

    const handleSettingsUpdated = (payload: RoomSettingsUpdatedPayload) => {
      // Don't show toast if the current user updated the settings
      if (payload.updatedBy === userId) {
        onSettingsUpdated?.(payload);
        return;
      }

      if (!mute) {
        toast.info(`Room settings updated by ${payload.updatedByUsername}`, {
          duration: 3000,
        });
      }
      onSettingsUpdated?.(payload);
    };

    on("room:settings_updated", handleSettingsUpdated);
    return () => off("room:settings_updated", handleSettingsUpdated);
  }, [socket, mute, onSettingsUpdated, userId]);

  // Room deleted handler
  useEffect(() => {
    if (!socket) return;

    const handleRoomDeleted = (payload: RoomDeletedPayload) => {
      // Don't show toast if we performed the action (API already showed success toast)
      if (payload.performedBy === userId) {
        onRoomDeleted?.(payload);
        return;
      }

      toast.error(`This room was deleted by ${payload.deletedByUsername}`, {
        duration: 5000,
      });
      onRoomDeleted?.(payload);
    };

    on("room:deleted", handleRoomDeleted);
    return () => off("room:deleted", handleRoomDeleted);
  }, [socket, onRoomDeleted]);

  return {
    isConnected,
  };
};
