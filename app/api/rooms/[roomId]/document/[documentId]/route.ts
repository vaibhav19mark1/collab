import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Document from "@/models/Document";
import Room from "@/models/Room";
import { generateColor } from "@/lib/helper";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; documentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, documentId } = await params;
    await connectDB();

    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isParticipant = room.isParticipant(session.user._id);

    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const document = await Document.findOne({ _id: documentId, roomId });
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const participant = room.participants.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.userId === session.user._id
    );

    const user = {
      id: session.user._id,
      name: session.user.name || "Anonymous",
      color:
        participant?.color || generateColor(session.user.name || "Anonymous"),
    };

    return NextResponse.json({ success: true, document, user });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; documentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, documentId } = await params;
    const { title } = await req.json();

    await connectDB();

    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isParticipant = room.isParticipant(session.user._id);

    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const document = await Document.findOneAndUpdate(
      { _id: documentId, roomId },
      { title },
      { new: true }
    );

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; documentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, documentId } = await params;

    await connectDB();

    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isParticipant = room.isParticipant(session.user._id);
    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const document = await Document.findOne({ _id: documentId, roomId });
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    await Document.deleteOne({ _id: documentId });

    // Cascading delete: removing associated Yjs updates
    try {
      await mongoose.connection.collection("yjs-documents").deleteMany({
        docName: `document:${documentId}`,
      });
    } catch (err) {
      console.error("Error deleting Yjs data:", err);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
