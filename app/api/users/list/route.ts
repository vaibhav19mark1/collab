import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    // Get all users
    const users = await User.find({}).select("-password").lean();

    // Get user count
    const userCount = await User.countDocuments();

    return NextResponse.json({
      success: true,
      count: userCount,
      users: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch users", details: errorMessage },
      { status: 500 }
    );
  }
}
