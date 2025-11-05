import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";

export async function GET(
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

    const room = await Room.findById(roomId).select("-password").lean() as any;

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this room
    const hasAccess =
      room.owner.toString() === session.user._id ||
      room.participants.some(
        (p: any) => p.userId.toString() === session.user._id
      );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
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
        participants: room.participants.map((p: any) => ({
          userId: p.userId.toString(),
          username: p.username,
          role: p.role,
          joinedAt: p.joinedAt,
        })),
        lastActivity: room.lastActivity,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Only owner can delete room
    if (room.owner.toString() !== session.user._id) {
      return NextResponse.json(
        { success: false, error: "Only room owner can delete the room" },
        { status: 403 }
      );
    }

    // Soft delete - set isActive to false
    room.isActive = false;
    await room.save();

    return NextResponse.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete room" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Only owner can update room
    if (room.owner.toString() !== session.user._id) {
      return NextResponse.json(
        { success: false, error: "Only room owner can update the room" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, isPrivate, maxParticipants } = body;

    if (name) room.name = name.trim();
    if (description !== undefined) room.description = description?.trim();
    if (isPrivate !== undefined) room.isPrivate = isPrivate;
    if (maxParticipants) room.maxParticipants = maxParticipants;

    await room.save();

    return NextResponse.json({
      success: true,
      message: "Room updated successfully",
      room: {
        _id: room._id.toString(),
        name: room.name,
        description: room.description,
        roomCode: room.roomCode,
        isPrivate: room.isPrivate,
        maxParticipants: room.maxParticipants,
      },
    });
  } catch (error: any) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update room" },
      { status: 500 }
    );
  }
}
