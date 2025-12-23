import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import bcrypt from "bcryptjs";
import { generateColor } from "@/lib/helper";

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
    const { name, description, isPrivate, password, maxParticipants } = body;

    // Validate user ID
    const userId = session.user._id || session.user.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID not found in session" },
        { status: 400 }
      );
    }

    // Validation
    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Room name must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (isPrivate && password && password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Generate unique room code
    const roomCode = await (
      Room as unknown as { generateRoomCode: () => Promise<string> }
    ).generateRoomCode();

    // Hash password if provided
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create room
    const room = await Room.create({
      name: name.trim(),
      description: description?.trim(),
      roomCode,
      owner: userId,
      isPrivate: isPrivate || false,
      password: hashedPassword,
      maxParticipants: maxParticipants || 10,
      participants: [
        {
          userId: userId,
          username: session.user.username || "Unknown",
          role: "owner",
          joinedAt: new Date(),
          color: generateColor(session.user.username || "Unknown"),
          avatar: session.user.image || undefined,
        },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        room: {
          _id: room._id.toString(),
          name: room.name,
          description: room.description,
          roomCode: room.roomCode,
          owner: room.owner.toString(),
          isPrivate: room.isPrivate,
          hasPassword: !!room.password,
          maxParticipants: room.maxParticipants,
          participantCount: room.participants.length,
          createdAt: room.createdAt,
        },
        message: "Room created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create room" },
      { status: 500 }
    );
  }
}
