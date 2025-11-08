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

    const query: Record<string, unknown> = { isActive: true };

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
    console.log({ session });
    const rooms = await Room.find(query)
      .sort({ lastActivity: -1 })
      .select("-password")
      .lean();

    type RoomDocument = {
      _id: { toString: () => string };
      name: string;
      description?: string;
      roomCode: string;
      owner: string;
      isPrivate: boolean;
      password?: string;
      maxParticipants: number;
      participants: Array<{
        userId: string;
        username: string;
        role: string;
        joinedAt: Date;
      }>;
      lastActivity: Date;
      createdAt: Date;
      updatedAt: Date;
    };

    const formattedRooms = (rooms as unknown as RoomDocument[]).map((room) => ({
      _id: room._id.toString(),
      name: room.name,
      description: room.description,
      roomCode: room.roomCode,
      owner: room.owner.toString(),
      isPrivate: room.isPrivate,
      hasPassword: !!room.password,
      maxParticipants: room.maxParticipants,
      participantCount: room.participants.length,
      participants: room.participants.map((p) => ({
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
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
