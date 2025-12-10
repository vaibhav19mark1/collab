import { useCallback } from "react";
import { Room, Participant, BannedUser } from "@/types/room.types";
import type {
  ParticipantJoinedPayload,
  ParticipantLeftPayload,
  ParticipantKickedPayload,
  ParticipantBannedPayload,
  ParticipantUnbannedPayload,
  ParticipantRoleChangedPayload,
  RoomSettingsUpdatedPayload,
} from "@/types/socket.types";

export const useRoomStateUpdates = (
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>
) => {
  const handleParticipantJoined = useCallback(
    (payload: ParticipantJoinedPayload) => {
      setRoom((prev) => {
        if (!prev) return prev;

        // Check if participant already exists
        const exists = prev.participants.some(
          (p) => p.userId === payload.participant.userId
        );

        if (exists) return prev;

        return {
          ...prev,
          participants: [
            ...prev.participants,
            payload.participant as Participant,
          ],
          lastActivity: new Date(),
        };
      });
    },
    [setRoom]
  );

  const handleParticipantLeft = useCallback(
    (payload: ParticipantLeftPayload) => {
      setRoom((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          participants: prev.participants.filter(
            (p) => p.userId !== payload.userId
          ),
          lastActivity: new Date(),
        };
      });
    },
    [setRoom]
  );

  const handleParticipantKicked = useCallback(
    (payload: ParticipantKickedPayload) => {
      setRoom((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          participants: prev.participants.filter(
            (p) => p.userId !== payload.kickedUserId
          ),
          lastActivity: new Date(),
        };
      });
    },
    [setRoom]
  );

  const handleParticipantBanned = useCallback(
    (payload: ParticipantBannedPayload) => {
      setRoom((prev) => {
        if (!prev) return prev;

        const newBannedUser: BannedUser = {
          userId: payload.bannedUserId,
          username: payload.bannedUsername,
          bannedAt: new Date(),
          bannedBy: payload.bannedBy,
          reason: payload.reason,
        };

        return {
          ...prev,
          participants: prev.participants.filter(
            (p) => p.userId !== payload.bannedUserId
          ),
          bannedUsers: [...(prev.bannedUsers || []), newBannedUser],
          lastActivity: new Date(),
        };
      });
    },
    [setRoom]
  );

  const handleParticipantUnbanned = useCallback(
    (payload: ParticipantUnbannedPayload) => {
      setRoom((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          bannedUsers: (prev.bannedUsers || []).filter(
            (b) => b.userId !== payload.unbannedUserId
          ),
          lastActivity: new Date(),
        };
      });
    },
    [setRoom]
  );

  const handleRoleChanged = useCallback(
    (payload: ParticipantRoleChangedPayload) => {
      setRoom((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          participants: prev.participants.map((p) =>
            p.userId === payload.userId ? { ...p, role: payload.newRole } : p
          ),
          lastActivity: new Date(),
        };
      });
    },
    [setRoom]
  );

  const handleSettingsUpdated = useCallback(
    (payload: RoomSettingsUpdatedPayload) => {
      setRoom((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          name: payload.updates.name ?? prev.name,
          description: payload.updates.description ?? prev.description,
          isPrivate: payload.updates.isPrivate ?? prev.isPrivate,
          maxParticipants:
            payload.updates.maxParticipants ?? prev.maxParticipants,
          lastActivity: new Date(),
        };
      });
    },
    [setRoom]
  );

  return {
    handleParticipantJoined,
    handleParticipantLeft,
    handleParticipantKicked,
    handleParticipantBanned,
    handleParticipantUnbanned,
    handleRoleChanged,
    handleSettingsUpdated,
  };
};
