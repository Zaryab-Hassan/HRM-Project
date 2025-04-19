import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { email, password, name } = body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin already exists' },
        { status: 400 }
      );
    }

    // Create new admin
    const admin = await Admin.create({
      email,
      password,
      name,
    });

    return NextResponse.json(
      { message: 'Admin registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
