import { auth } from "@/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const userId = session.user._id;

    const createdCount = await Room.countDocuments({ owner: userId });
    const joinedCount = await Room.countDocuments({
      "participants.userId": userId,
      owner: { $ne: userId },
    });

    return NextResponse.json({
      created: createdCount,
      joined: joinedCount,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
