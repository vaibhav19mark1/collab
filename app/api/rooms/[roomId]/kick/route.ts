import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";

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
          error: "Only room owner or admins can kick users",
        },
        { status: 403 }
      );
    }

    // Cannot kick the owner
    if (room.isOwner(userId)) {
      return NextResponse.json(
        { success: false, error: "Cannot kick the room owner" },
        { status: 400 }
      );
    }

    // Admins cannot kick other admins (only owner can)
    if (room.isAdmin(userId) && !room.isOwner(session.user._id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only the room owner can kick admins",
        },
        { status: 403 }
      );
    }

    // Check if user is in the room
    const participantIndex = room.participants.findIndex(
      (p: { userId: string }) => p.userId === userId
    );

    if (participantIndex === -1) {
      return NextResponse.json(
        { success: false, error: "User is not in this room" },
        { status: 400 }
      );
    }

    // Remove user from participants
    const kickedUser = room.participants[participantIndex];
    room.participants.splice(participantIndex, 1);

    await room.save();

    return NextResponse.json({
      success: true,
      message: `${kickedUser.username} has been kicked from the room`,
    });
  } catch (error) {
    console.error("Error kicking user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to kick user" },
      { status: 500 }
    );
  }
}
