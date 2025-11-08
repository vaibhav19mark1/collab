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

    const room = await Room.findById(roomId);

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Owner cannot leave their own room
    if (room.owner.toString() === session.user._id) {
      return NextResponse.json(
        {
          success: false,
          error: "Room owner cannot leave. Delete the room instead.",
        },
        { status: 400 }
      );
    }

    // Remove user from participants
    room.participants = room.participants.filter(
      (p: { userId: { toString: () => string } }) => p.userId.toString() !== session.user._id
    );

    await room.save();

    return NextResponse.json({
      success: true,
      message: "Successfully left the room",
    });
  } catch (error) {
    console.error("Error leaving room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to leave room" },
      { status: 500 }
    );
  }
}
