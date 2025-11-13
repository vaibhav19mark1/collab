"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
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
  Users,
  Calendar,
  Lock,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface InviteData {
  invite: {
    _id: string;
    roomId: string;
    roomName: string;
    inviterUsername: string;
    expiresAt: Date;
  };
  room: {
    _id: string;
    name: string;
    description?: string;
    participantCount: number;
    maxParticipants: number;
    isPrivate: boolean;
  };
}

export default function InviteAcceptPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      validateInvite();
    }
  }, [token]);

  const validateInvite = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/rooms/invite/${token}`);
      setInviteData(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Invalid invite link");
      } else {
        setError("Failed to validate invite");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!session) {
      // Store the invite token in sessionStorage to redirect after login
      sessionStorage.setItem("pendingInvite", token);
      router.push("/login");
      return;
    }

    setIsAccepting(true);
    setError(null);

    try {
      const response = await axios.post(`/api/rooms/invite/${token}/accept`);
      setSuccess(true);

      // Redirect to room after 1 second
      setTimeout(() => {
        router.push(`/rooms/${response.data.room._id}`);
      }, 1000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to accept invite");
      } else {
        setError("Failed to accept invite");
      }
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-orange-500" />
            <p className="text-muted-foreground">Validating invite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Invalid Invite</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push("/rooms")} className="w-full">
              Go to Rooms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Success!</h2>
            <p className="text-muted-foreground mb-4">
              You've joined the room successfully
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to room...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData) return null;

  const expiresIn = Math.ceil(
    (new Date(inviteData.invite.expiresAt).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            {inviteData.invite.inviterUsername} invited you to join
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Room Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">{inviteData.room.name}</h3>
              {inviteData.room.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {inviteData.room.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Participants</span>
                </div>
                <span className="font-medium">
                  {inviteData.room.participantCount} /{" "}
                  {inviteData.room.maxParticipants}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm">Privacy</span>
                </div>
                <span className="font-medium">
                  {inviteData.room.isPrivate ? "Private" : "Public"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Invite expires in</span>
                </div>
                <span className="font-medium">
                  {expiresIn} day{expiresIn !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleAcceptInvite}
              disabled={isAccepting}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : status === "authenticated" ? (
                "Accept Invite & Join Room"
              ) : (
                "Sign In to Join Room"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/rooms")}
              className="w-full"
            >
              Decline
            </Button>
          </div>

          {status !== "authenticated" && (
            <p className="text-xs text-center text-muted-foreground">
              You'll be redirected to sign in and then automatically join the
              room
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
