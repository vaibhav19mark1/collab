import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Lock, Calendar, Copy, Check } from "lucide-react";
import { Room } from "@/types/room.types";

interface RoomInfoCardProps {
  room: Room;
  copied: boolean;
  onCopyCode: () => void;
}

export const RoomInfoCard = ({
  room,
  copied,
  onCopyCode,
}: RoomInfoCardProps) => {
  const formatRoomCode = (code: string) => {
    return code.match(/.{1,3}/g)?.join("-") || code;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Information</CardTitle>
        <CardDescription>Details about this collaboration room</CardDescription>
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
            onClick={onCopyCode}
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
  );
};
