import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Loader2,
  Shield,
  UserCheck,
  UserX,
  Ban,
} from "lucide-react";
import { Participant } from "@/types/room.types";
import { generateColor } from "@/lib/helper";
import axios from "axios";
import { toast } from "sonner";

interface ParticipantsCardProps {
  roomId: string;
  participants: Participant[];
  currentUserId: string;
  isOwner: boolean;
  canManage: boolean;
  setConfirmDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      title: string;
      description: string;
      confirmText: string;
      variant: "default" | "destructive";
      onConfirm: () => void;
    } | null>
  >;
}

export const ParticipantsCard = ({
  roomId,
  participants,
  currentUserId,
  isOwner,
  canManage,
  setConfirmDialog,
}: ParticipantsCardProps) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canManageParticipant = (participant: Participant) => {
    if (participant.userId === currentUserId) return false;
    if (participant.role === "owner") return false;

    const currentUserParticipant = participants.find(
      (p) => p.userId === currentUserId
    );
    if (!currentUserParticipant) return false;

    if (currentUserParticipant.role === "owner") return true;
    if (
      currentUserParticipant.role === "admin" &&
      participant.role === "member"
    ) {
      return true;
    }

    return false;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
      case "admin":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    setActionLoading(userId);
    const newRole = currentRole === "admin" ? "member" : "admin";

    try {
      await axios.patch(`/api/rooms/${roomId}/role`, { userId, role: newRole });
      toast.success(
        `User ${newRole === "admin" ? "promoted to" : "demoted from"} admin`
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to update role");
      } else {
        toast.error("Failed to update role");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const performKickUser = async (userId: string, username: string) => {
    setActionLoading(userId);
    try {
      await axios.post(`/api/rooms/${roomId}/kick`, { userId });
      toast.success(`${username} has been kicked from the room`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to kick user");
      } else {
        toast.error("Failed to kick user");
      }
    } finally {
      setActionLoading(null);
      setConfirmDialog(null); // Close dialog after action
    }
  };

  const handleKickUser = (userId: string, username: string) => {
    setConfirmDialog({
      open: true,
      title: `Kick ${username}?`,
      description: `Are you sure you want to kick ${username} from this room? They can rejoin later using the room code.`,
      confirmText: "Kick",
      variant: "destructive",
      onConfirm: () => performKickUser(userId, username),
    });
  };

  const performBanUser = async (userId: string, username: string) => {
    setActionLoading(userId);
    try {
      await axios.post(`/api/rooms/${roomId}/ban`, {
        userId,
        reason: "Banned by room moderator",
      });
      toast.success(`${username} has been banned from the room`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to ban user");
      } else {
        toast.error("Failed to ban user");
      }
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  const handleBanUser = (userId: string, username: string) => {
    setConfirmDialog({
      open: true,
      title: `Ban ${username}?`,
      description: `Are you sure you want to ban ${username} from this room? They will not be able to rejoin until unbanned.`,
      confirmText: "Ban User",
      variant: "destructive",
      onConfirm: () => performBanUser(userId, username),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants</CardTitle>
        <CardDescription>
          {participants.length} member{participants.length !== 1 ? "s" : ""} in
          this room
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
          {participants.map((participant: Participant) => {
            const canManageThis = canManageParticipant(participant);
            const isLoadingThis = actionLoading === participant.userId;
            const avatarColor =
              participant.color || generateColor(participant.username);

            return (
              <div
                key={participant.userId}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {participant.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{participant.username}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined{" "}
                      {new Date(participant.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                      participant.role
                    )}`}
                  >
                    {participant.role}
                  </div>

                  {canManage && canManageThis && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={isLoadingThis}
                        >
                          {isLoadingThis ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isOwner && participant.role !== "owner" && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleRole(
                                  participant.userId,
                                  participant.role
                                )
                              }
                            >
                              {participant.role === "admin" ? (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Demote to Member
                                </>
                              ) : (
                                <>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Promote to Admin
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}

                        <DropdownMenuItem
                          onClick={() =>
                            handleKickUser(
                              participant.userId,
                              participant.username
                            )
                          }
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Kick User
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            handleBanUser(
                              participant.userId,
                              participant.username
                            )
                          }
                          className="text-destructive focus:text-destructive"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Ban User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};