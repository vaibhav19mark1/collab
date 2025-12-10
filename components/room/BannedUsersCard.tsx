import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserCheck } from "lucide-react";
import { BannedUser } from "@/types/room.types";
import axios from "axios";
import { toast } from "sonner";

interface BannedUsersCardProps {
  roomId: string;
  bannedUsers: BannedUser[];
}

export const BannedUsersCard = ({
  roomId,
  bannedUsers,
}: BannedUsersCardProps) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!bannedUsers || bannedUsers.length === 0) return null;

  const handleUnbanUser = async (userId: string, username: string) => {
    setActionLoading(userId);

    try {
      await axios.post(`/api/rooms/${roomId}/unban`, { userId });
      toast.success(`${username} has been unbanned`);
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

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Banned Users</CardTitle>
        <CardDescription>
          Users who have been banned from this room
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {bannedUsers.map((bannedUser) => {
            const isLoadingThis = actionLoading === bannedUser.userId;

            return (
              <div
                key={bannedUser.userId}
                className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold">
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
  );
};
