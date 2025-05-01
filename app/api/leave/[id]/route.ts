import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';
import Manager from '@/models/Manager';

// Get a specific leave request
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.email;
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

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error('Error fetching leave request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update a leave request (approve/reject)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {  
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Extract user details from session
    const userId = session.user.email;
    const userRole = session.user.role || '';

    if (!['manager', 'hr'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const leaveRequest = await LeaveRequest.findById(params.id);
    
    if (!leaveRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // For managers, check if employee is in their team
    if (userRole === 'manager') {
      const manager = await Manager.findById(userId);
      if (!manager.team.includes(leaveRequest.employeeId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    leaveRequest.status = status;
    leaveRequest.approvedBy = userId;
    leaveRequest.approvalDate = new Date();
    await leaveRequest.save();

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
  request: NextRequest,
  { params }: { params: { id: string } }
) {  
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Extract user details from session
    const userId = session.user.email;
    const userRole = session.user.role;

    const request = await LeaveRequest.findById(params.id);
    
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Only allow employees to delete their own pending requests
    if (userRole === 'employee') {
      if (
        request.employeeId.toString() !== userId ||
        request.status !== 'pending'
      ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    await LeaveRequest.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
