import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const { name, username, email, password } = await request.json()

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      )
    }

    // Create new user
    const userData: {
      name?: string;
      username: string;
      email: string;
      password: string;
    } = {
      username,
      email,
      password,
    }
    
    if (name) {
      userData.name = name
    }
    
    const user = await User.create(userData)

    // Return success response (without password)
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle mongoose validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      const validationError = error as unknown as { errors: Record<string, { message: string }> }
      const messages = Object.values(validationError.errors).map((err) => err.message)
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      )
    }

    // Handle duplicate key errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const duplicateError = error as unknown as { keyPattern: Record<string, unknown> }
      const field = Object.keys(duplicateError.keyPattern)[0]
      return NextResponse.json(
        { error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
