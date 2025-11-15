import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Invite from "@/models/Invite";
import Room from "@/models/Room";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
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

    const { token } = await params;

    // Find invite
    const invite = await Invite.findById(token);

    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invite not found" },
        { status: 404 }
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

    // Check if user has permission (owner or admin)
    if (!room.canManageParticipants(session.user._id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only room owner or admins can revoke invites",
        },
        { status: 403 }
      );
    }

    // Mark invite as revoked
    invite.status = "revoked";
    await invite.save();

    return NextResponse.json({
      success: true,
      message: "Invite revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json(
      { success: false, error: "Failed to revoke invite" },
      { status: 500 }
    );
  }
}
