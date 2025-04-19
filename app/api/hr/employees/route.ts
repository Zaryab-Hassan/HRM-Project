import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is authorized (HR or manager role)
    if (session.user.role !== 'hr' && session.user.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied: Insufficient permissions' }, { status: 403 });
    }
    
    // Find all employees, excluding sensitive fields
    const employees = await Employee.find().select('-password');

    return NextResponse.json({
      success: true,
      data: employees
    });
    
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees data' },
      { status: 500 }
    );
  }
}
