import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';
import Manager from '@/models/Manager';

// Get a specific leave request
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  
  try {
    await dbConnect();
    // Using getServerSession with authOptions only
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }    const userEmail = session.user.email;
    const userId = session.user.id;
    const userRole = session.user.role;

    const leaveRequest = await LeaveRequest.findById(id)
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name email');

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (userRole === 'employee' && leaveRequest.employeeId.toString() !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (userRole === 'manager') {
      const manager = await Manager.findById(userId);
      if (!manager.team.includes(leaveRequest.employeeId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Allow HR users to access any leave request
    if (userRole === 'hr') {
      // HR has access to all leave requests
    }

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error('Error fetching leave request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update a leave request (approve/reject)
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {  
  try {
    await dbConnect();
    // Using getServerSession with authOptions only
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }    // Extract user details from session
    const userEmail = session.user.email;
    const userId = session.user.id; // Get the actual user ID
    const userRole = session.user.role || '';

    if (!['manager', 'hr'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    // Updated to check for capitalized status values to match schema
    if (!['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be Approved or Rejected' },
        { status: 400 }
      );
    }

    const leaveRequest = await LeaveRequest.findById(context.params.id);
    
    if (!leaveRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }    // For managers, check if employee is in their team
    if (userRole === 'manager') {
      const manager = await Manager.findById(userId);
      
      if (!manager) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
      }
        // Check if manager has a team array and if employee is in it
      if (!manager.team || !manager.team.some((empId: any) => 
        empId.toString() === leaveRequest.employeeId.toString()
      )) {
        return NextResponse.json({ error: 'Not authorized to manage this employee' }, { status: 401 });
      }
    }    // HR users can approve/reject any leave request
    // No additional checks needed for HR

    leaveRequest.status = status;
    leaveRequest.approvedBy = userId; // This is the ObjectId from session.user.id
    leaveRequest.approvalDate = new Date();
    
    try {
      await leaveRequest.save();
    } catch (err) {
      console.error('Error saving leave request:', err);
      return NextResponse.json(
        { error: 'Failed to update leave request status' },
        { status: 500 }
      );
    }

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a leave request
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {  
  try {
    await dbConnect();
    // Using getServerSession with authOptions only
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Extract user details from session
    const userId = session.user.email;
    const userRole = session.user.role;

    const request = await LeaveRequest.findById(context.params.id);
    
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Only allow employees to delete their own pending requests
    if (userRole === 'employee') {
      if (
        request.employeeId.toString() !== userId ||
        request.status !== 'Pending'  // Changed from 'pending' to 'Pending' to match frontend
      ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Allow HR users to delete any leave request
    if (userRole === 'hr') {
      // HR can delete any leave request
    }

    await LeaveRequest.findByIdAndDelete(context.params.id);

    return NextResponse.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
