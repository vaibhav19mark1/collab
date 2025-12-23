import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import Invite from "@/models/Invite";
import crypto from "crypto";
import { Invite as InviteLean } from "@/types/room.types";
import { sendInviteEmail } from "@/lib/send-invite-email";

// Configuration
const DEFAULT_EXPIRY_DAYS = 7;
const MAX_INVITES_PER_ROOM = 50; // Limit invites per room

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
    const { expiryDays = DEFAULT_EXPIRY_DAYS, inviteeEmail } = body;

    // Find room
    const room = await Room.findById(roomId);

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
          error: "Only room owner or admins can create invites",
        },
        { status: 403 }
      );
    }

    // Check invite limit
    const activeInvitesCount = await Invite.countDocuments({
      roomId,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (activeInvitesCount >= MAX_INVITES_PER_ROOM) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum of ${MAX_INVITES_PER_ROOM} active invites reached. Revoke some invites first.`,
        },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Create invite
    const invite = await Invite.create({
      roomId,
      roomName: room.name,
      token,
      inviterId: session.user._id,
      inviterUsername: session.user.username,
      inviteeEmail,
      status: "pending",
      expiresAt,
    });

    // Generate invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${token}`;

    if (inviteeEmail) {
      try {
        await sendInviteEmail({
          to: inviteeEmail,
          inviterName: session.user.username || "Someone",
          roomName: room.name,
          roomDescription: room.description || "",
          inviteUrl,
          expiresInDays: expiryDays,
        });
      } catch (error) {
        console.error("Failed to send invite email:", error);
      }
    }

    return NextResponse.json({
      success: true,
      invite: {
        _id: invite._id.toString(),
        roomId: invite.roomId,
        roomName: invite.roomName,
        token: invite.token,
        inviterId: invite.inviterId,
        inviterUsername: invite.inviterUsername,
        inviteeEmail: invite.inviteeEmail,
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        updatedAt: invite.updatedAt,
      },
      inviteUrl,
      emailSent: !!inviteeEmail,
      message: inviteeEmail
        ? "Invite created and email sent successfully"
        : "Invite link created successfully",
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

// GET - List all invites for a room
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

    // Find room
    const room = await Room.findById(roomId);

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
          error: "Only room owner or admins can view invites",
        },
        { status: 403 }
      );
    }

    // Get all invites for this room
    const invites = await Invite.find({
      roomId,
    })
      .sort({ createdAt: -1 })
      .lean<InviteLean[]>();

    return NextResponse.json({
      success: true,
      invites: invites.map((invite) => ({
        _id: invite._id.toString(),
        roomId: invite.roomId,
        roomName: invite.roomName,
        token: invite.token,
        inviterId: invite.inviterId,
        inviterUsername: invite.inviterUsername,
        inviteeEmail: invite.inviteeEmail,
        status: invite.status,
        expiresAt: invite.expiresAt,
        acceptedAt: invite.acceptedAt,
        acceptedBy: invite.acceptedBy,
        createdAt: invite.createdAt,
        updatedAt: invite.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}
