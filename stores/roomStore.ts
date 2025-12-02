import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Room } from "@/types/room.types";

interface RoomState {
  allRooms: Room[];

  // actions
  setRooms: (rooms: Room[]) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>()(
  devtools(
    (set) => ({
      allRooms: [],

      setRooms: (rooms) =>
        set({
          allRooms: rooms,
        }),

      reset: () =>
        set({
          allRooms: [],
        }),
    }),
    { name: "RoomStore" }
  )
);
