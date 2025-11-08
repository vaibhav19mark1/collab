import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { roomCode, password } = body;

    if (!roomCode) {
      return NextResponse.json(
        { success: false, error: "Room code is required" },
        { status: 400 }
      );
    }

    // Find room by code (need to include password for verification)
    const room = await Room.findOne({
      roomCode: roomCode.toUpperCase(),
      isActive: true,
    }).select("+password");

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Check if user is already a participant
    if (room.isParticipant(session.user._id)) {
      return NextResponse.json(
        {
          success: true,
          message: "Already a member of this room",
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

    // Verify password if room is password protected
    if (room.password) {
      if (!password) {
        return NextResponse.json(
          { success: false, error: "Password is required" },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, room.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: "Invalid password" },
          { status: 401 }
        );
      }
    }

    // Add user to participants
    room.participants.push({
      userId: session.user._id as string,
      username: session.user.username as string,
      role: "member",
      joinedAt: new Date(),
    });

    await room.save();

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
    console.error("Error joining room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to join room" },
      { status: 500 }
    );
  }
}
