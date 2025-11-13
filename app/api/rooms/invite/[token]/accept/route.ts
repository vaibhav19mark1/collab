import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Invite from "@/models/Invite";
import Room from "@/models/Room";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    await dbConnect();

    const { token } = await params;

    // Find invite
    const invite = await Invite.findOne({ token });

    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invalid invite link" },
        { status: 404 }
      );
    }

    // Check if invite is valid
    if (!invite.isValid()) {
      return NextResponse.json(
        {
          success: false,
          error:
            invite.status === "expired"
              ? "Invite link has expired"
              : `Invite is ${invite.status}`,
        },
        { status: 400 }
      );
    }

    // Find room
    const room = await Room.findById(invite.roomId);

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Check if user is banned
    if (room.isBanned(session.user._id)) {
      return NextResponse.json(
        { success: false, error: "You are banned from this room" },
        { status: 403 }
      );
    }

    // Check if user is already a participant
    if (room.isParticipant(session.user._id)) {
      return NextResponse.json(
        {
          success: true,
          message: "You are already a member of this room",
          room: {
            _id: room._id.toString(),
            roomCode: room.roomCode,
          },
        },
        { status: 200 }
      );
    }

    // Check if room is full
    if (room.participants.length >= room.maxParticipants) {
      return NextResponse.json(
        { success: false, error: "Room is full" },
        { status: 400 }
      );
    }

    // Add user to room
    room.participants.push({
      userId: session.user._id,
      username: session.user.username,
      role: "member",
      joinedAt: new Date(),
    });

    await room.save();

    // Mark invite as accepted
    invite.status = "accepted";
    invite.acceptedAt = new Date();
    invite.acceptedBy = session.user._id;
    await invite.save();

    return NextResponse.json({
      success: true,
      message: "Successfully joined the room",
      room: {
        _id: room._id.toString(),
        name: room.name,
        roomCode: room.roomCode,
      },
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { success: false, error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
