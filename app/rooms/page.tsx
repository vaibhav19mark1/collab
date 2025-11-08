"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { RoomModal } from "@/components/RoomModal";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, FolderOpen } from "lucide-react";
import { Room, RoomFilter } from "@/types/room.types";

export default function RoomsPage() {
  const { data: session, status } = useSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<RoomFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRooms();
    }
  }, [status, filter]);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/rooms?filter=${filter}`);
      if (!response.ok) throw new Error("Failed to fetch rooms");

      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setIsLoading(false);
    }
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
        <Button onClick={() => setIsModalOpen(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
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
          <TabsTrigger value="all">All Rooms</TabsTrigger>
          <TabsTrigger value="owned">My Rooms</TabsTrigger>
          <TabsTrigger value="joined">Joined</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Room List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : rooms.length === 0 ? (
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
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Room
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              currentUserId={session.user._id}
              onDelete={fetchRooms}
              onLeave={fetchRooms}
            />
          ))}
        </div>
      )}

      {/* Room Modal */}
      <RoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRooms}
      />
    </div>
  );
}
