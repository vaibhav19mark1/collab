import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all, owned, joined

    let query: any = { isActive: true };

    if (filter === "owned") {
      query.owner = session.user._id;
    } else if (filter === "joined") {
      query["participants.userId"] = session.user._id;
      query.owner = { $ne: session.user._id }; // Exclude owned rooms
    } else {
      // All rooms user has access to
      query.$or = [
        { owner: session.user._id },
        { "participants.userId": session.user._id },
      ];
    }

    const rooms = await Room.find(query)
      .sort({ lastActivity: -1 })
      .select("-password")
      .lean();

    const formattedRooms = rooms.map((room: any) => ({
      _id: room._id.toString(),
      name: room.name,
      description: room.description,
      roomCode: room.roomCode,
      owner: room.owner.toString(),
      isPrivate: room.isPrivate,
      hasPassword: !!room.password,
      maxParticipants: room.maxParticipants,
      participantCount: room.participants.length,
      participants: room.participants.map((p: any) => ({
        userId: p.userId.toString(),
        username: p.username,
        role: p.role,
        joinedAt: p.joinedAt,
      })),
      lastActivity: room.lastActivity,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      rooms: formattedRooms,
    });
  } catch (error: any) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
