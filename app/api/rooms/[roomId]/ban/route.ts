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
    const { userId, reason } = body;

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
          error: "Only room owner or admins can ban users",
        },
        { status: 403 }
      );
    }

    // Cannot ban the owner
    if (room.isOwner(userId)) {
      return NextResponse.json(
        { success: false, error: "Cannot ban the room owner" },
        { status: 400 }
      );
    }

    // Admins cannot ban other admins (only owner can)
    if (room.isAdmin(userId) && !room.isOwner(session.user._id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only the room owner can ban admins",
        },
        { status: 403 }
      );
    }

    // Check if user is already banned
    if (room.isBanned(userId)) {
      return NextResponse.json(
        { success: false, error: "User is already banned" },
        { status: 400 }
      );
    }

    // Find user to get their username
    const participant = room.participants.find(
      (p: { userId: string }) => p.userId === userId
    );

    if (!participant) {
      return NextResponse.json(
        { success: false, error: "User is not in this room" },
        { status: 400 }
      );
    }

    // Remove user from participants
    room.participants = room.participants.filter(
      (p: { userId: string }) => p.userId !== userId
    );

    // Add to banned list
    room.bannedUsers.push({
      userId,
      username: participant.username,
      bannedBy: session.user._id,
      bannedAt: new Date(),
      reason,
    });

    await room.save();

    return NextResponse.json({
      success: true,
      message: `${participant.username} has been banned from the room`,
    });
  } catch (error) {
    console.error("Error banning user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to ban user" },
      { status: 500 }
    );
  }
}
