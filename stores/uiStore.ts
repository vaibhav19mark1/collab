import { create } from "zustand";
import { devtools } from "zustand/middleware";

type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "reconnecting";

interface NotificationPreferences {
  mute: boolean;
  sounds: boolean;
  showJoinLeave: boolean;
  showKickBan: boolean;
}

interface UIState {
  socketStatus: ConnectionStatus;
  yjsStatus: ConnectionStatus;
  activeRoomId: string | null;
  chatOpen: boolean;
  participantsOpen: boolean;
  settingsOpen: boolean;
  notificationPreferences: NotificationPreferences;

  //actions
  setSocketStatus: (status: ConnectionStatus) => void;
  setYjsStatus: (status: ConnectionStatus) => void;
  setActiveRoomId: (roomId: string | null) => void;
  toggleChat: () => void;
  toggleParticipants: () => void;
  toggleSettings: () => void;
  setNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  reset: () => void;
}

const defaultNotificationPreferences: NotificationPreferences = {
  mute: false,
  sounds: true,
  showJoinLeave: true,
  showKickBan: true,
};

const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      socketStatus: "disconnected",
      yjsStatus: "disconnected",
      activeRoomId: null,
      chatOpen: false,
      participantsOpen: false,
      settingsOpen: false,
      notificationPreferences: defaultNotificationPreferences,

      setSocketStatus: (status) => set({ socketStatus: status }),
      setYjsStatus: (status) => set({ yjsStatus: status }),
      setActiveRoomId: (roomId) => set({ activeRoomId: roomId }),
      toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
      toggleParticipants: () =>
        set((state) => ({ participantsOpen: !state.participantsOpen })),
      toggleSettings: () =>
        set((state) => ({ settingsOpen: !state.settingsOpen })),
      setNotificationPreferences: (prefs) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            ...prefs,
          },
        })),
      reset: () =>
        set({
          activeRoomId: null,
          chatOpen: false,
          participantsOpen: false,
          settingsOpen: false,
          notificationPreferences: defaultNotificationPreferences,
        }),
    }),
    { name: "UIStore" }
  )
);

export { useUIStore };
