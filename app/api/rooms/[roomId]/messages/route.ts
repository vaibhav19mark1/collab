import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import Message from "@/models/Message";
import { socketEmitter } from "@/lib/socket-emitter";

// POST - Send a message
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
    const { message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { success: false, error: "Message too long (max 500 characters)" },
        { status: 400 }
      );
    }

    // Verify room exists and user is a participant
    const room = await Room.findById(roomId);

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    const userId = session.user._id as string;
    const isParticipant = room.isParticipant(userId);

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: "You are not a member of this room" },
        { status: 403 }
      );
    }

    // Save message to database
    const newMessage = await Message.create({
      roomId,
      userId,
      username: session.user.username,
      message: message.trim(),
    });

    const messageId = String(newMessage._id);

    // emit socket event
    socketEmitter.chatMessage({
      roomId,
      messageId,
      userId,
      username: session.user.username as string,
      message: message.trim(),
      timestamp: newMessage.createdAt,
    });

    return NextResponse.json({
      success: true,
      message: {
        messageId,
        userId,
        username: session.user.username,
        message: newMessage.message,
        timestamp: newMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// GET - Fetch message history
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
    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get("take") || "50");
    const skip = searchParams.get("skip"); // For pagination

    // Verify room exists and user is a participant
    const room = await Room.findById(roomId);

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    const userId = session.user._id as string;
    const isParticipant = room.isParticipant(userId);

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: "You are not a member of this room" },
        { status: 403 }
      );
    }

    // Build query
    const query: { roomId: string; _id?: { $lt: string } } = { roomId };
    if (skip) {
      query._id = { $lt: skip };
    }

    // Fetch messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(take)
      .lean();

    return NextResponse.json({
      success: true,
      messages: messages.reverse().map((msg) => ({
        messageId: msg._id.toString(),
        userId: msg.userId,
        username: msg.username,
        message: msg.message,
        timestamp: msg.createdAt,
      })),
      hasMore: messages.length === take,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
