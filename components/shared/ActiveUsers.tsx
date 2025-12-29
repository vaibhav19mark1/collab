"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { WebsocketProvider } from "y-websocket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Participant } from "@/types/room.types";

interface ActiveUsersProps {
  provider: WebsocketProvider | null;
  participants: Participant[];
  maxDisplay?: number;
}

export const ActiveUsers = ({
  provider,
  participants,
  maxDisplay = 3,
}: ActiveUsersProps) => {
  const { data: session } = useSession();
  const [activeUserIds, setActiveUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!provider) return;

    const updateActiveUsers = () => {
      const states = provider.awareness.getStates();
      const active = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      states.forEach((state: any) => {
        if (state.user?.id) {
          active.add(state.user.id);
        }
      });
      setActiveUserIds(active);
    };

    updateActiveUsers();
    provider.awareness.on("change", updateActiveUsers);

    return () => {
      provider.awareness.off("change", updateActiveUsers);
    };
  }, [provider]);

  const activeUsers = participants.filter((p) => activeUserIds.has(p.userId));
  const displayParticipants = activeUsers.slice(0, maxDisplay);
  const remainingParticipants = Math.max(0, activeUsers.length - maxDisplay);

  return (
    <div className="flex -space-x-2">
      {displayParticipants.map((participant) => {
        const initials = participant.username
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <TooltipProvider key={participant.userId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-background cursor-pointer transition-transform hover:z-10 hover:scale-110">
                  <AvatarImage
                    src={
                      participant.userId === session?.user?._id
                        ? (session?.user?.image as string)
                        : participant.avatar
                    }
                    alt={participant.username}
                  />
                  <AvatarFallback
                    className="text-xs"
                    style={{
                      backgroundColor: participant.color || "#000",
                      color: "white",
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{participant.username}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      {remainingParticipants > 0 && (
        <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium z-10">
          +{remainingParticipants}
        </div>
      )}
    </div>
  );
};
