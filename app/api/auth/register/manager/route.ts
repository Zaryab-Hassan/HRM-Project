import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Manager from '@/models/Manager';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { 
      email, 
      password, 
      name, 
      department, 
      phone,
      role 
    } = body;

    // Validate required fields
    if (!email || !password || !name || !department || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'manager') {
      return NextResponse.json(
        { error: 'Invalid role for manager registration' },
        { status: 400 }
      );
    }

    // Check if manager already exists
    const existingManager = await Manager.findOne({ email });
    if (existingManager) {
      return NextResponse.json(
        { error: 'Manager with this email already exists' },
        { status: 400 }
      );
    }

    // Create new manager with all required fields
    const manager = await Manager.create({
      email,
      password,
      name,
      department,
      phone,
      role: 'manager',
      status: 'Active',
      team: [],
      permissions: {
        canManageLeaves: true,
        canManageAttendance: true,
        canManagePayroll: false
      }
    });

    return NextResponse.json(
      { message: 'Manager registered successfully', id: manager._id },
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
