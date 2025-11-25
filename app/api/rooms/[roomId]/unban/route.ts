import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import { socketEmitter } from "@/lib/socket-emitter";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { roomId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Check if requester has permission (owner or admin)
    if (!room.canManageParticipants(session.user._id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only room owner or admins can unban users",
        },
        { status: 403 }
      );
    }

    // Check if user is banned
    if (!room.isBanned(userId)) {
      return NextResponse.json(
        { success: false, error: "User is not banned" },
        { status: 400 }
      );
    }

    // Find banned user to get username
    const unBannedUser = room.bannedUsers.find(
      (b: { userId: string }) => b.userId === userId
    );

    // Remove from banned list
    room.bannedUsers = room.bannedUsers.filter(
      (b: { userId: string }) => b.userId !== userId
    );

    await room.save();

    socketEmitter.participantUnbanned({
      roomId: room._id.toString(),
      unbannedUserId: userId,
      unbannedUsername: unBannedUser?.username,
      unbannedBy: session.user._id as string,
      unbannedByUsername: session.user.username as string,
    });

    return NextResponse.json({
      success: true,
      message: `${unBannedUser?.username || "User"} has been unbanned`,
    });
  } catch (error) {
    console.error("Error unbanning user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unban user" },
      { status: 500 }
    );
  }
}
