import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invite from "@/models/Invite";
import Room from "@/models/Room";
import { Invite as InviteLean, Room as RoomLean } from "@/types/room.types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await dbConnect();

    const { token } = await params;

    // Find invite by token
    const invite = await Invite.findOne({ token }).lean<InviteLean>();

    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invalid invite link" },
        { status: 404 }
      );
    }

    // Check if invite is expired
    if (invite.expiresAt < new Date()) {
      // Update status to expired
      await Invite.findByIdAndUpdate(invite._id, { status: "expired" });

      return NextResponse.json(
        { success: false, error: "Invite link has expired" },
        { status: 410 }
      );
    }

    // Check if invite is already used or revoked
    if (invite.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Invite is ${invite.status}`,
        },
        { status: 400 }
      );
    }

    // Get room details
    const room = await Room.findById(invite.roomId)
      .select("-password")
      .lean<RoomLean>();

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Check if room is full
    if (room.participants.length >= room.maxParticipants) {
      return NextResponse.json(
        { success: false, error: "Room is full" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invite: {
        _id: invite._id.toString(),
        roomId: invite.roomId,
        roomName: invite.roomName,
        inviterUsername: invite.inviterUsername,
        expiresAt: invite.expiresAt,
      },
      room: {
        _id: room._id.toString(),
        name: room.name,
        description: room.description,
        participantCount: room.participants.length,
        maxParticipants: room.maxParticipants,
        isPrivate: room.isPrivate,
      },
    });
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}
