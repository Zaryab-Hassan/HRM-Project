import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';

export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const {
      name,
      cnic,
      department,
      role,
      email,
      phone,
      emergencyContact,
      dob,
      initialSalary,
      currentSalary,
      shift,
      expiryDate,
      password
    } = body;

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee already exists' },
        { status: 400 }
      );
    }

    // Create new employee
    const employee = await Employee.create({
      name,
      cnic,
      department,
      role,
      email,
      phone,
      emergencyContact,
      dob,
      initialSalary,
      currentSalary,
      shift,
      expiryDate,
      password
    });

    return NextResponse.json(
      { message: 'Employee registered successfully' },
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
