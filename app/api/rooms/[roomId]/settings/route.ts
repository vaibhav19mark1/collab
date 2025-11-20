import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import bcrypt from "bcryptjs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { roomId } = await params;
    const body = await request.json();
    const { name, description, password, maxParticipants, isPrivate } = body;

    // Find room
    const room = await Room.findById(roomId);

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    if (!room.canManageParticipants(session.user._id)) {
      return NextResponse.json(
        { error: "Only room owner or admins can update settings" },
        { status: 403 }
      );
    }

    const updates: string[] = [];

    // Update name
    if (name !== undefined && name.trim()) {
      const oldName = room.name;
      room.name = name.trim();
      if (oldName !== room.name) {
        updates.push(`name from "${oldName}" to "${room.name}"`);
      }
    }

    // Update description
    if (description !== undefined) {
      const oldDesc = room.description || "";
      room.description = description.trim() || undefined;
      if (oldDesc !== (room.description || "")) {
        updates.push("description");
      }
    }

    // Update password
    if (password !== undefined) {
      if (password === "") {
        // Remove password
        if (room.password) {
          room.password = undefined;
          room.isPrivate = false;
          updates.push("removed password");
        }
      } else if (password.length >= 4) {
        // Set/update password
        const hashedPassword = await bcrypt.hash(password, 12);
        room.password = hashedPassword;
        room.isPrivate = true;
        updates.push(room.password ? "updated password" : "added password");
      } else {
        return NextResponse.json(
          { error: "Password must be at least 4 characters" },
          { status: 400 }
        );
      }
    }

    // Update max participants
    if (maxParticipants !== undefined) {
      const newMax = parseInt(maxParticipants);
      if (newMax >= 2 && newMax <= 100) {
        const oldMax = room.maxParticipants;
        room.maxParticipants = newMax;
        if (oldMax !== newMax) {
          updates.push(`max participants from ${oldMax} to ${newMax}`);
        }
      } else {
        return NextResponse.json(
          { error: "Max participants must be between 2 and 100" },
          { status: 400 }
        );
      }
    }

    // Update privacy setting (only if no password)
    if (isPrivate !== undefined && !room.password) {
      const oldPrivacy = room.isPrivate;
      room.isPrivate = Boolean(isPrivate);
      if (oldPrivacy !== room.isPrivate) {
        updates.push(`privacy to ${room.isPrivate ? "private" : "public"}`);
      }
    }

    await room.save();

    return NextResponse.json({
      success: true,
      message: updates.length > 0 ? "Room settings updated successfully" : "No changes made",
      room: {
        _id: room._id.toString(),
        name: room.name,
        description: room.description,
        isPrivate: room.isPrivate,
        hasPassword: !!room.password,
        maxParticipants: room.maxParticipants,
        participantCount: room.participants.length,
      },
    });
  } catch (error) {
    console.error("Error updating room settings:", error);
    return NextResponse.json(
      { error: "Failed to update room settings" },
      { status: 500 }
    );
  }
}
