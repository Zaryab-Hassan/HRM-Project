import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';

// Updates an employee's status
export async function PUT(req: Request) {
  try {
    await dbConnect();

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user has appropriate role (manager or HR)
    if (session.user.role !== 'manager' && session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Access denied: Insufficient permissions' }, { status: 403 });
    }
    
    // Parse request body
    const body = await req.json();
    const { employeeId, status } = body;

    // Validate input
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Check if status is valid
    const validStatuses = ['Active', 'On Leave', 'Terminated'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    // Update the employee status
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { status },
      { new: true }
    ).select('-password');

    if (!updatedEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Employee status updated successfully',
      data: updatedEmployee
    });
    
  } catch (error) {
    console.error('Error updating employee status:', error);
    return NextResponse.json(
      { error: 'Failed to update employee status' },
      { status: 500 }
    );
  }
}
