import axios from "axios";
import {
  ParticipantBannedPayload,
  ParticipantJoinedPayload,
  ParticipantKickedPayload,
  ParticipantLeftPayload,
  ParticipantRoleChangedPayload,
  ParticipantUnbannedPayload,
  RoomDeletedPayload,
  RoomSettingsUpdatedPayload,
  ChatMessagePayload,
} from "@/types/socket.types";

type SocketEventPayload =
  | ParticipantJoinedPayload
  | ParticipantLeftPayload
  | ParticipantKickedPayload
  | ParticipantBannedPayload
  | ParticipantUnbannedPayload
  | ParticipantRoleChangedPayload
  | RoomSettingsUpdatedPayload
  | RoomDeletedPayload;

const SOCKET_SERVER_BASE_URL =
  process.env.SOCKET_URL || "http://localhost:3001";
const ADMIN_KEY = process.env.SOCKET_ADMIN_KEY!;

// Use HTTP POST to emit events from serverless functions
const emitToSocketServer = async (
  event: string,
  payload: SocketEventPayload
) => {
  console.log(`[EMITTER] Sending ${event} to socket server`, payload);
  try {
    await axios.post(
      `${SOCKET_SERVER_BASE_URL}/emit`,
      { event, payload },
      {
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
      }
    );
  } catch (error) {
    console.error(error);
  }
};

const socketEmitter = {
  participantJoined: (payload: ParticipantJoinedPayload) => {
    emitToSocketServer("server:participant:joined", payload);
  },

  participantLeft: (payload: ParticipantLeftPayload) => {
    emitToSocketServer("server:participant:left", payload);
  },

  participantKicked: (payload: ParticipantKickedPayload) => {
    emitToSocketServer("server:participant:kicked", payload);
  },

  participantBanned: (payload: ParticipantBannedPayload) => {
    emitToSocketServer("server:participant:banned", payload);
  },

  participantUnbanned: (payload: ParticipantUnbannedPayload) => {
    emitToSocketServer("server:participant:unbanned", payload);
  },

  participantRoleChanged: (payload: ParticipantRoleChangedPayload) => {
    emitToSocketServer("server:participant:role_changed", payload);
  },

  roomSettingsUpdated: (payload: RoomSettingsUpdatedPayload) => {
    emitToSocketServer("server:room:settings_updated", payload);
  },

  roomDeleted: (payload: RoomDeletedPayload) => {
    emitToSocketServer("server:room:deleted", payload);
  },

  chatMessage: async (payload: ChatMessagePayload) => {
    console.log("[EMITTER] Emitting chat:message event:", payload);
    await emitToSocketServer("chat:message", payload);
  },
};

export { socketEmitter };
