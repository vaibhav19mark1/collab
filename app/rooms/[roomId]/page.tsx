"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, redirect } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Lock,
  Crown,
  Copy,
  Check,
  ArrowLeft,
  Trash2,
  LogOut,
  Loader2,
  Settings,
  Calendar,
  MoreVertical,
  Shield,
  UserX,
  Ban,
  UserCheck,
  Link,
  X,
  Mail,
  Search,
} from "lucide-react";
import { Room, Participant, Invite } from "@/types/room.types";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RoomDetailsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showKickDialog, setShowKickDialog] = useState<{
    userId: string;
    username: string;
  } | null>(null);
  const [showBanDialog, setShowBanDialog] = useState<{
    userId: string;
    username: string;
  } | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{_id: string; username: string; email: string}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Array<{_id: string; username: string; email: string}>>([]);
  const [customEmail, setCustomEmail] = useState("");
  const [inviteTab, setInviteTab] = useState<"users" | "email">("users");

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && roomId) {
      fetchRoom();
    }
  }, [status, roomId]);

  useEffect(() => {
    if (showInvites && room && session) {
      const isOwner = room.owner === session.user._id;
      const currentUserParticipant = room.participants.find(
        (p) => p.userId === session.user._id
      );
      const isAdmin = currentUserParticipant?.role === "admin";
      const canManageRoom = isOwner || isAdmin;

      if (canManageRoom) {
        fetchInvites();
      }
    }
  }, [showInvites, room, session]);

  const fetchRoom = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/rooms/${roomId}`);
      setRoom(response.data.room);
    } catch (error) {
      console.error("Error fetching room:", error);
      router.push("/rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const response = await axios.get(`/api/rooms/${roomId}/invite`);
      setInvites(response.data.invites || []);
    } catch (error) {
      console.error("Error fetching invites:", error);
    }
  };

  const handleGenerateInviteLink = async (email?: string) => {
    setIsGeneratingInvite(true);
    try {
      const response = await axios.post(`/api/rooms/${roomId}/invite`, {
        expiryDays: 7,
        inviteeEmail: email,
      });

      const inviteUrl = response.data.inviteUrl;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);

      if (response.data.emailSent) {
        toast.success(`Invite link copied and email sent to ${email}!`);
      } else {
        toast.success("Invite link copied to clipboard!");
      }
      await fetchInvites(); // Refresh invites list
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error || "Failed to generate invite link"
        );
      } else {
        toast.error("Failed to generate invite link");
      }
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      await axios.delete(`/api/rooms/invite/${inviteId}/revoke`);
      toast.success("Invite revoked successfully");
      await fetchInvites(); // Refresh invites list
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to revoke invite");
      } else {
        toast.error("Failed to revoke invite");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvites = async () => {
    setIsGeneratingInvite(true);
    try {
      const emailsToInvite = inviteTab === "users" 
        ? selectedUsers.map(u => u.email)
        : [customEmail];

      if (emailsToInvite.length === 0) {
        toast.error("Please select users or enter an email");
        setIsGeneratingInvite(false);
        return;
      }

      const results = await Promise.allSettled(
        emailsToInvite.map(email => 
          axios.post(`/api/rooms/${roomId}/invite`, { 
            expiryDays: 7,
            inviteeEmail: email 
          })
        )
      );

      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(`${successful} invite${successful > 1 ? 's' : ''} sent successfully!`);
        await fetchInvites();
        setShowInviteModal(false);
        setSelectedUsers([]);
        setCustomEmail("");
        setSearchQuery("");
      }

      if (failed > 0) {
        toast.error(`${failed} invite${failed > 1 ? 's' : ''} failed to send`);
      }
    } catch {
      toast.error("Failed to send invites");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`/api/users/search`, {
        params: { q: query, roomId: roomId }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("User search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && inviteTab === "users") {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, inviteTab]);

  const toggleUserSelection = (user: {_id: string; username: string; email: string}) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else if (prev.length < 5) {
        return [...prev, user];
      } else {
        toast.error("You can only select up to 5 users");
        return prev;
      }
    });
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCopyInviteLink = async (token: string) => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/invite/${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied!");
  };

  const handleCopyCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    try {
      await axios.delete(`/api/rooms/${roomId}`);

      toast.success("Room deleted successfully");
      router.push("/rooms");
    } catch {
      toast.error("Failed to delete room");
    }
  };

  const handleLeave = async () => {
    setShowLeaveDialog(false);
    try {
      await axios.post(`/api/rooms/${roomId}/leave`);

      toast.success("Left room successfully");
      router.push("/rooms");
    } catch {
      toast.error("Failed to leave room");
    }
  };

  const handleKickUser = async () => {
    if (!showKickDialog) return;

    const userId = showKickDialog.userId;
    setShowKickDialog(null);
    setActionLoading(userId);

    try {
      await axios.post(`/api/rooms/${roomId}/kick`, { userId });
      toast.success(`${showKickDialog.username} has been kicked from the room`);
      await fetchRoom();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to kick user");
      } else {
        toast.error("Failed to kick user");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async () => {
    if (!showBanDialog) return;

    const userId = showBanDialog.userId;
    setShowBanDialog(null);
    setActionLoading(userId);

    try {
      await axios.post(`/api/rooms/${roomId}/ban`, {
        userId,
        reason: "Banned by room moderator",
      });
      toast.success(`${showBanDialog.username} has been banned from the room`);
      await fetchRoom();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to ban user");
      } else {
        toast.error("Failed to ban user");
      }
    } finally {
      setActionLoading(null);
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
      await fetchRoom();
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

  const handleUnbanUser = async (userId: string, username: string) => {
    setActionLoading(userId);

    try {
      await axios.post(`/api/rooms/${roomId}/unban`, { userId });
      toast.success(`${username} has been unbanned`);
      await fetchRoom();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to unban user");
      } else {
        toast.error("Failed to unban user");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const canManageParticipant = (participant: Participant) => {
    if (!room || !session) return false;
    if (participant.userId === session.user._id) return false; // Can't manage yourself
    if (participant.role === "owner") return false; // Can't manage owner

    const currentUserParticipant = room.participants.find(
      (p) => p.userId === session.user._id
    );
    if (!currentUserParticipant) return false;

    if (currentUserParticipant.role === "owner") return true; // Owner can manage all
    if (
      currentUserParticipant.role === "admin" &&
      participant.role === "member"
    ) {
      return true; // Admin can manage members
    }

    return false;
  };

  const formatRoomCode = (code: string) => {
    return code.match(/.{1,3}/g)?.join("-") || code;
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

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session || !room) {
    return null;
  }

  const isOwner = room.owner === session.user._id;
  const currentUserParticipant = room.participants.find(
    (p) => p.userId === session.user._id
  );
  const isAdmin = currentUserParticipant?.role === "admin";
  const canManage = isOwner || isAdmin;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/rooms")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rooms
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{room.name}</h1>
              {isOwner && (
                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-medium">
                  <Crown className="h-4 w-4" />
                  <span>Owner</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground">
              {room.description || "No description provided"}
            </p>
          </div>

          <div className="flex gap-2">
            {canManage && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleGenerateInviteLink()}
                  disabled={isGeneratingInvite}
                >
                  {isGeneratingInvite ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : copiedInvite ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Link className="mr-2 h-4 w-4" />
                  )}
                  {copiedInvite ? "Link Copied!" : "Copy Invite Link"}
                </Button>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  disabled={isGeneratingInvite}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invites
                </Button>
              </>
            )}
            {isOwner ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Room
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowLeaveDialog(true)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave Room
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Room Information */}
        <Card>
          <CardHeader>
            <CardTitle>Room Information</CardTitle>
            <CardDescription>
              Details about this collaboration room
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Room Code */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">
                  Room Code
                </p>
                <p className="font-mono text-2xl font-bold tracking-wider">
                  {formatRoomCode(room.roomCode)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-9 w-9 p-0"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Participants</span>
                </div>
                <span className="font-medium">
                  {room.participants.length} / {room.maxParticipants}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm">Privacy</span>
                </div>
                <span className="font-medium">
                  {room.isPrivate ? "Private" : "Public"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Created</span>
                </div>
                <span className="font-medium">
                  {new Date(room.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Last Activity</span>
                </div>
                <span className="font-medium">
                  {new Date(room.lastActivity).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>
              {room.participants.length} member
              {room.participants.length !== 1 ? "s" : ""} in this room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
              {room.participants.map((participant: Participant) => {
                const canManageThis = canManageParticipant(participant);
                const isLoadingThis = actionLoading === participant.userId;

                return (
                  <div
                    key={participant.userId}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
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
                                setShowKickDialog({
                                  userId: participant.userId,
                                  username: participant.username,
                                })
                              }
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Kick User
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                setShowBanDialog({
                                  userId: participant.userId,
                                  username: participant.username,
                                })
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
      </div>

      {/* Banned Users Section - Only visible to owner/admin */}
      {canManage && room.bannedUsers && room.bannedUsers.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Banned Users</CardTitle>
            <CardDescription>
              Users who have been banned from this room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {room.bannedUsers.map((bannedUser) => {
                const isLoadingThis = actionLoading === bannedUser.userId;

                return (
                  <div
                    key={bannedUser.userId}
                    className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                        {bannedUser.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{bannedUser.username}</p>
                        <p className="text-xs text-muted-foreground">
                          Banned{" "}
                          {new Date(bannedUser.bannedAt).toLocaleDateString()}
                          {bannedUser.reason && ` • ${bannedUser.reason}`}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleUnbanUser(bannedUser.userId, bannedUser.username)
                      }
                      disabled={isLoadingThis}
                    >
                      {isLoadingThis ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="mr-2 h-4 w-4" />
                      )}
                      Unban
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Invites Section - Only visible to owner/admin */}
      {canManage && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invite Links</CardTitle>
                <CardDescription>
                  Manage pending invitation links for this room
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInvites(!showInvites)}
              >
                {showInvites ? "Hide" : "Show"}
              </Button>
            </div>
          </CardHeader>
          {showInvites && (
            <CardContent>
              {invites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active invites</p>
                  <p className="text-sm">
                    Generate an invite link to share with others
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invites
                    .filter(
                      (invite) =>
                        invite.status === "pending" &&
                        new Date(invite.expiresAt) > new Date()
                    )
                    .map((invite) => {
                      const isLoadingThis = actionLoading === invite._id;
                      const expiresIn = Math.ceil(
                        (new Date(invite.expiresAt).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      );

                      return (
                        <div
                          key={invite._id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                              <Link className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                Created by {invite.inviterUsername}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Expires in {expiresIn} day
                                {expiresIn !== 1 ? "s" : ""} •{" "}
                                {new Date(
                                  invite.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyInviteLink(invite.token)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvite(invite._id)}
                              disabled={isLoadingThis}
                              className="text-destructive hover:text-destructive"
                            >
                              {isLoadingThis ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  {invites.filter(
                    (invite) =>
                      invite.status === "pending" &&
                      new Date(invite.expiresAt) > new Date()
                  ).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>All invites have expired</p>
                      <p className="text-sm">
                        Generate a new invite link to share
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Collaboration Tools Placeholder */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Collaboration Tools</CardTitle>
          <CardDescription>
            Real-time collaboration features coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-6 border rounded-lg text-center opacity-50">
              <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Text Editor</p>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </div>
            <div className="p-6 border rounded-lg text-center opacity-50">
              <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Code Editor</p>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </div>
            <div className="p-6 border rounded-lg text-center opacity-50">
              <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Whiteboard</p>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDeleteDialog && (
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Room"
          description="Are you sure you want to delete this room? This action cannot be undone and all participants will be removed."
          confirmText="Delete Room"
          cancelText="Cancel"
          onConfirm={handleDelete}
          variant="destructive"
        />
      )}

      {showLeaveDialog && (
        <ConfirmDialog
          open={showLeaveDialog}
          onOpenChange={setShowLeaveDialog}
          title="Leave Room"
          description="Are you sure you want to leave this room? You can rejoin later using the room code."
          confirmText="Leave Room"
          cancelText="Cancel"
          onConfirm={handleLeave}
          variant="default"
        />
      )}

      {showKickDialog && (
        <ConfirmDialog
          open={!!showKickDialog}
          onOpenChange={() => setShowKickDialog(null)}
          title="Kick User"
          description={`Are you sure you want to kick ${showKickDialog.username} from this room? They can rejoin later using the room code.`}
          confirmText="Kick User"
          cancelText="Cancel"
          onConfirm={handleKickUser}
          variant="default"
        />
      )}

      {showBanDialog && (
        <ConfirmDialog
          open={!!showBanDialog}
          onOpenChange={() => setShowBanDialog(null)}
          title="Ban User"
          description={`Are you sure you want to ban ${showBanDialog.username} from this room? They will not be able to rejoin until unbanned.`}
          confirmText="Ban User"
          cancelText="Cancel"
          onConfirm={handleBanUser}
          variant="destructive"
        />
      )}

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Invites</DialogTitle>
            <DialogDescription>
              Search for registered users or enter an email address to send room invitations.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={inviteTab} onValueChange={(v) => setInviteTab(v as "users" | "email")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">Search Users</TabsTrigger>
              <TabsTrigger value="email">Enter Email</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by username or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected ({selectedUsers.length}/5)</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(user => (
                      <div
                        key={user._id}
                        className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                      >
                        <span>{user.username}</span>
                        <button
                          onClick={() => toggleUserSelection(user)}
                          className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchQuery && (
                <div className="space-y-2">
                  <Label>Results</Label>
                  <div className="border rounded-md max-h-[200px] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                        Searching...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="divide-y">
                        {searchResults.map(user => {
                          const isSelected = selectedUsers.find(u => u._id === user._id);
                          return (
                            <div
                              key={user._id}
                              onClick={() => toggleUserSelection(user)}
                              className={`p-3 cursor-pointer hover:bg-secondary/50 transition-colors ${
                                isSelected ? 'bg-secondary' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{user.username}</p>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No users found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                />
                {customEmail && !isValidEmail(customEmail) && (
                  <p className="text-xs text-destructive">Please enter a valid email address</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteModal(false);
                setSelectedUsers([]);
                setCustomEmail("");
                setSearchQuery("");
              }}
              disabled={isGeneratingInvite}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvites}
              disabled={
                isGeneratingInvite ||
                (inviteTab === "users" && selectedUsers.length === 0) ||
                (inviteTab === "email" && (!customEmail || !isValidEmail(customEmail)))
              }
            >
              {isGeneratingInvite ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invite{inviteTab === "users" && selectedUsers.length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
