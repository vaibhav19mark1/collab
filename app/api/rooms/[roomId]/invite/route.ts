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

// Type for invite result
type InviteResult = {
  invite: {
    _id: string;
    roomId: string;
    roomName: string;
    token: string;
    inviterId: string;
    inviterUsername: string;
    inviteeEmail?: string;
    status: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  inviteUrl: string;
  emailSent: boolean;
  email: string | undefined;
};

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
    const {
      expiryDays = DEFAULT_EXPIRY_DAYS,
      inviteeEmail,
      inviteeEmails,
    } = body;

    // Support both single email and batch emails
    const emailsToInvite: (string | undefined)[] = inviteeEmails
      ? Array.isArray(inviteeEmails)
        ? inviteeEmails
        : [inviteeEmails]
      : inviteeEmail
      ? [inviteeEmail]
      : [undefined];

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

    const newInvitesCount = emailsToInvite.length;
    if (activeInvitesCount + newInvitesCount > MAX_INVITES_PER_ROOM) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum of ${MAX_INVITES_PER_ROOM} active invites reached. You can create ${
            MAX_INVITES_PER_ROOM - activeInvitesCount
          } more invites.`,
        },
        { status: 400 }
      );
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Generate base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create invites for all emails
    const invitePromises: Promise<InviteResult>[] = emailsToInvite.map(
      async (email) => {
        const token = crypto.randomBytes(32).toString("hex");

        const invite = await Invite.create({
          roomId,
          roomName: room.name,
          token,
          inviterId: session.user._id,
          inviterUsername: session.user.username,
          inviteeEmail: email,
          status: "pending",
          expiresAt,
        });

        const inviteUrl = `${baseUrl}/invite/${token}`;

        // Send email if provided
        let emailSent = false;
        if (email) {
          try {
            await sendInviteEmail({
              to: email,
              inviterName: session.user.username || "Someone",
              roomName: room.name,
              roomDescription: room.description || "",
              inviteUrl,
              expiresInDays: expiryDays,
            });
            emailSent = true;
          } catch (error) {
            console.error(`Failed to send invite email to ${email}:`, error);
          }
        }

        return {
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
          emailSent,
          email,
        };
      }
    );

    const results = await Promise.allSettled(invitePromises);

    const successful = results
      .filter(
        (r): r is PromiseFulfilledResult<InviteResult> =>
          r.status === "fulfilled"
      )
      .map((r) => r.value);

    const failed = results.filter((r) => r.status === "rejected");

    // If single invite, return old format for backward compatibility
    if (emailsToInvite.length === 1 && successful.length === 1) {
      return NextResponse.json({
        success: true,
        ...successful[0],
        message: successful[0].emailSent
          ? "Invite created and email sent successfully"
          : "Invite link created successfully",
      });
    }

    // For batch invites, return detailed results
    return NextResponse.json({
      success: true,
      results: {
        successful: successful.length,
        failed: failed.length,
        total: emailsToInvite.length,
        invites: successful,
      },
      message: `${successful.length} invite${
        successful.length !== 1 ? "s" : ""
      } created successfully${
        failed.length > 0 ? `, ${failed.length} failed` : ""
      }`,
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
