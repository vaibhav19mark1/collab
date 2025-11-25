import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import { socketEmitter } from "@/lib/socket-emitter";

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
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: "User ID and role are required" },
        { status: 400 }
      );
    }

    if (!["admin", "member"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be 'admin' or 'member'" },
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

    // Only owner can change roles
    if (!room.isOwner(session.user._id)) {
      return NextResponse.json(
        { success: false, error: "Only room owner can change user roles" },
        { status: 403 }
      );
    }

    // Cannot change owner's role
    if (room.isOwner(userId)) {
      return NextResponse.json(
        { success: false, error: "Cannot change the owner's role" },
        { status: 400 }
      );
    }

    // Find participant
    const participant = room.participants.find(
      (p: { userId: string }) => p.userId === userId
    );

    if (!participant) {
      return NextResponse.json(
        { success: false, error: "User is not in this room" },
        { status: 400 }
      );
    }

    const oldRole = participant.role;

    // Update role
    participant.role = role;
    await room.save();

    socketEmitter.participantRoleChanged({
      roomId: room._id.toString(),
      userId,
      username: participant.username,
      oldRole,
      newRole: role,
      changedBy: session.user._id as string,
      changedByUsername: session.user.username as string,
    });

    return NextResponse.json({
      success: true,
      message: `${participant.username}'s role updated to ${role}`,
      participant: {
        userId: participant.userId,
        username: participant.username,
        role: participant.role,
      },
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
