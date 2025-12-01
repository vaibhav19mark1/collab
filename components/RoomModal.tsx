"use client";

import { useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2, Lock, Users } from "lucide-react";
import { Room } from "@/types/room.types";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated?: (room: Room) => void;
  onRoomJoined?: (room: Room) => void;
}

export function RoomModal({
  isOpen,
  onClose,
  onRoomCreated,
  onRoomJoined,
}: RoomModalProps) {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Create Room State
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    isPrivate: false,
    password: "",
    maxParticipants: 10,
  });

  // Join Room State
  const [joinForm, setJoinForm] = useState({
    roomCode: "",
    password: "",
  });

  const [needsPassword, setNeedsPassword] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validation
      if (createForm.name.trim().length < 3) {
        throw new Error("Room name must be at least 3 characters");
      }

      if (createForm.isPrivate && createForm.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const response = await axios.post("/api/rooms/create", {
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        isPrivate: createForm.isPrivate,
        password: createForm.isPrivate ? createForm.password : undefined,
        maxParticipants: createForm.maxParticipants,
      });

      const newRoom = response.data.room;

      // Call optimistic update callback
      if (newRoom) {
        onRoomCreated?.(newRoom);
      }

      // Reset form
      setCreateForm({
        name: "",
        description: "",
        isPrivate: false,
        password: "",
        maxParticipants: 10,
      });

      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!joinForm.roomCode.trim()) {
        throw new Error("Room code is required");
      }

      const response = await axios.post("/api/rooms/join", {
        roomCode: joinForm.roomCode.trim().toUpperCase(),
        password: joinForm.password || undefined,
      });

      const joinedRoom = response.data.room;

      // Call optimistic update callback
      if (joinedRoom) {
        onRoomJoined?.(joinedRoom);
      }

      // Reset form
      setJoinForm({ roomCode: "", password: "" });
      setNeedsPassword(false);

      onClose();
    } catch (err) {
      // If password is required but not provided
      if (err instanceof Error && "response" in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { error?: string } };
        };
        if (
          axiosError.response?.status === 400 &&
          axiosError.response?.data?.error?.includes("Password")
        ) {
          setNeedsPassword(true);
          setError(axiosError.response.data.error);
        } else {
          const errorMessage =
            axiosError.response?.data?.error ||
            err.message ||
            "An error occurred";
          setError(errorMessage);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    setCreateForm({
      name: "",
      description: "",
      isPrivate: false,
      password: "",
      maxParticipants: 10,
    });
    setJoinForm({ roomCode: "", password: "" });
    setNeedsPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Room</DialogTitle>
          <DialogDescription>
            Create a new room or join an existing one
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "create" | "join")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Room</TabsTrigger>
            <TabsTrigger value="join">Join Room</TabsTrigger>
          </TabsList>

          {/* Create Room Tab */}
          <TabsContent value="create" className="space-y-4">
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Room Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="My Collaboration Room"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What's this room for?"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="private" className="cursor-pointer">
                      Private Room
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Require a password to join
                  </p>
                </div>
                <Switch
                  id="private"
                  checked={createForm.isPrivate}
                  onCheckedChange={(checked) =>
                    setCreateForm({ ...createForm, isPrivate: checked })
                  }
                />
              </div>

              {createForm.isPrivate && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter room password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        password: e.target.value,
                      })
                    }
                    required={createForm.isPrivate}
                    minLength={6}
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Label>Max Participants</Label>
                  </div>
                  <span className="text-sm font-medium">
                    {createForm.maxParticipants}
                  </span>
                </div>
                <Slider
                  value={[createForm.maxParticipants]}
                  onValueChange={(value) =>
                    setCreateForm({
                      ...createForm,
                      maxParticipants: value[0],
                    })
                  }
                  min={2}
                  max={50}
                  step={1}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Room"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Join Room Tab */}
          <TabsContent value="join" className="space-y-4">
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode">
                  Room Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="roomCode"
                  placeholder="ABCD12"
                  value={joinForm.roomCode}
                  onChange={(e) =>
                    setJoinForm({
                      ...joinForm,
                      roomCode: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  maxLength={6}
                  className="uppercase font-mono tracking-wider"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the 6-character room code
                </p>
              </div>

              {needsPassword && (
                <div className="space-y-2">
                  <Label htmlFor="join-password">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="join-password"
                    type="password"
                    placeholder="Enter room password"
                    value={joinForm.password}
                    onChange={(e) =>
                      setJoinForm({ ...joinForm, password: e.target.value })
                    }
                    required={needsPassword}
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Room"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
