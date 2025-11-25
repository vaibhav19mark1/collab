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

// Use HTTP POST to emit events from serverless functions
const emitToSocketServer = async (event: string, payload: any) => {
  const socketUrl =
    process.env.SOCKET_URL || "http://localhost:3001";
  
  console.log(`[EMITTER] Sending ${event} to socket server`, payload);
  
  try {
    const response = await fetch(`${socketUrl}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, payload }),
    });
    
    if (!response.ok) {
      console.error(`[EMITTER] Failed to emit ${event}:`, response.statusText);
    }
  } catch (error) {
    console.error(`[EMITTER] Error emitting ${event}:`, error);
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
};

export { socketEmitter };
