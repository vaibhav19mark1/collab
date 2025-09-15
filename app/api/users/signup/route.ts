import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

await dbConnect();

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { username, email, password} = reqBody;

    console.log({ reqBody });

    //check if user already exists
    const user = await User.findOne({ email });

    if (user) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    console.log({ savedUser });

    return NextResponse.json({
      message: "User created successfully",
      success: true,
      savedUser,
      status: 201,
    });
  } catch (error: any) {
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    // Handle duplicate errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        {
          error: `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } already exists`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
