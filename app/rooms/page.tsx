"use client";

import { useEffect, useState, useOptimistic } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { RoomModal } from "@/components/RoomModal";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, FolderOpen } from "lucide-react";
import { Room, RoomFilter } from "@/types/room.types";
import { roomModalTabs } from "./helper";
import { fetchRooms } from "./api";
import { useSocket } from "@/hooks/useSocket";
import {
  RoomDeletedPayload,
  RoomSettingsUpdatedPayload,
  ParticipantJoinedPayload,
  ParticipantLeftPayload,
} from "@/types/socket.types";

export default function RoomsPage() {
  const { data: session, status } = useSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<RoomFilter>("all");
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Socket for real-time updates
  const { socket, on, off } = useSocket();

  // Optimistic updates for instant UI feedback
  type OptimisticAction =
    | { type: "add"; payload: Room }
    | { type: "remove"; payload: string }
    | { type: "update"; payload: { id: string; updates: Partial<Room> } };

  const [optimisticRooms, updateOptimisticRooms] = useOptimistic(
    rooms,
    (state: Room[], action: OptimisticAction) => {
      switch (action.type) {
        case "add":
          return [action.payload, ...state];
        case "remove":
          return state.filter((room) => room._id !== action.payload);
        case "update":
          return state.map((room) =>
            room._id === action.payload.id
              ? { ...room, ...action.payload.updates }
              : room
          );
        default:
          return state;
      }
    }
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  // Fetch rooms on mount and filter change
  useEffect(() => {
    if (status === "authenticated") {
      fetchRooms({ setIsLoading, setRooms, filter });
    }
  }, [status, filter]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Room deleted
    const handleRoomDeleted = (payload: RoomDeletedPayload) => {
      console.log("[RoomsPage] Room deleted:", payload.roomId);
      setRooms((prev) => prev.filter((room) => room._id !== payload.roomId));
    };

    // Room settings updated
    const handleSettingsUpdated = (payload: RoomSettingsUpdatedPayload) => {
      console.log("[RoomsPage] Room settings updated:", payload.roomId);
      setRooms((prev) =>
        prev.map((room) =>
          room._id === payload.roomId
            ? {
                ...room,
                name: payload.updates.name ?? room.name,
                description: payload.updates.description ?? room.description,
                maxParticipants:
                  payload.updates.maxParticipants ?? room.maxParticipants,
                isPrivate: payload.updates.isPrivate ?? room.isPrivate,
                lastActivity: new Date(),
              }
            : room
        )
      );
    };

    // Participant joined - refetch to get updated participant list
    const handleParticipantJoined = (payload: ParticipantJoinedPayload) => {
      console.log("[RoomsPage] Participant joined:", payload.roomId);
      // Refetch to get accurate participant data
      fetchRooms({ setIsLoading, setRooms, filter });
    };

    // Participant left - refetch to get updated participant list
    const handleParticipantLeft = (payload: ParticipantLeftPayload) => {
      console.log("[RoomsPage] Participant left:", payload.roomId);
      // Refetch to get accurate participant data
      fetchRooms({ setIsLoading, setRooms, filter });
    };

    on("room:deleted", handleRoomDeleted);
    on("room:settings_updated", handleSettingsUpdated);
    on("participant:joined", handleParticipantJoined);
    on("participant:left", handleParticipantLeft);

    return () => {
      off("room:deleted", handleRoomDeleted);
      off("room:settings_updated", handleSettingsUpdated);
      off("participant:joined", handleParticipantJoined);
      off("participant:left", handleParticipantLeft);
    };
  }, [socket, filter, on, off]);

  const handleRoomCreated = (room: Room) => {
    updateOptimisticRooms({ type: "add", payload: room });
    setTimeout(() => {
      fetchRooms({ setIsLoading, setRooms, filter });
    }, 300);
  };

  const handleRoomJoined = (room: Room) => {
    updateOptimisticRooms({ type: "add", payload: room });
    setTimeout(() => {
      fetchRooms({ setIsLoading, setRooms, filter });
    }, 300);
  };

  const handleRoomDeleted = (roomId: string) => {
    updateOptimisticRooms({ type: "remove", payload: roomId });
  };

  const handleRoomLeft = (roomId: string) => {
    updateOptimisticRooms({ type: "remove", payload: roomId });
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Rooms</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your collaboration rooms
          </p>
        </div>
        <Button onClick={() => setIsRoomModalOpen(true)} size="lg">
          <Plus className="h-5 w-5" />
          New Room
        </Button>
      </div>

      {/* Filters */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as RoomFilter)}
        className="mb-6"
      >
        <TabsList>
          {roomModalTabs.map(({ value, name }) => (
            <TabsTrigger key={value} value={value}>
              {name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Room List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : optimisticRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No rooms found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {filter === "owned"
              ? "You haven't created any rooms yet. Click 'New Room' to get started."
              : filter === "joined"
              ? "You haven't joined any rooms yet. Use a room code to join one."
              : "You don't have any rooms yet. Create or join one to get started."}
          </p>
          <Button onClick={() => setIsRoomModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create/Join Your First Room
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {optimisticRooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              currentUserId={session.user._id}
              onDelete={handleRoomDeleted}
              onLeave={handleRoomLeft}
            />
          ))}
        </div>
      )}

      {/* Room Modal */}
      {isRoomModalOpen && (
        <RoomModal
          isOpen={isRoomModalOpen}
          onClose={() => setIsRoomModalOpen(false)}
          onRoomCreated={handleRoomCreated}
          onRoomJoined={handleRoomJoined}
        />
      )}
    </div>
  );
}
