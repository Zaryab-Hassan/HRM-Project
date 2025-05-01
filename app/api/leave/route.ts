import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
const JWT_SECRET = process.env.JWT_SECRET || 'secret'; // Use process.env instead of env
import dbConnect from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';
import Employee from '@/models/Employee';
import Manager from '@/models/Manager';

// Get all leave requests based on user role
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Parse URL to get query parameters
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');
    const source = url.searchParams.get('source');
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Extract user details from session
    const userId = session.user.id;
    const userRole = session.user.role;
    
    let queryFilter: any = {};
    
    // Apply status filter if provided
    if (statusFilter) {
      queryFilter.status = statusFilter;
    }
    
    let requests = [];
    
    // For employees - get their own requests
    if (userRole === 'employee') {
      queryFilter.employeeId = userId;
      
      requests = await LeaveRequest.find(queryFilter)
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 });
    }
    // For managers - get requests from their team members
    else if (userRole === 'manager') {
      const manager = await Manager.findById(userId);
      if (!manager) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
      }
      
      // If explicitly requesting from leaveRequest.db, use the collection name
      if (source === 'leaveRequest.db') {
        // Direct query to ensure we get all data from leaveRequest.db
        // Convert documents to plain objects to avoid any serialization issues
        const rawRequests = await LeaveRequest.find().lean().sort({ createdAt: -1 });
        
        // Process raw requests to ensure properly formatted data
        requests = rawRequests.map(req => ({
          ...req,
          _id: (req as any)._id?.toString() || '', // Ensure MongoDB ObjectId is converted to string
          status: req.status || 'Pending', // Default status if missing
          createdAt: req.createdAt ? req.createdAt.toISOString() : new Date().toISOString()
        }));
      } 
      else if (manager.team && manager.team.length > 0) {
        queryFilter.employeeId = { $in: manager.team };
        
        requests = await LeaveRequest.find(queryFilter)
          .populate('employeeId', 'name email')
          .populate('approvedBy', 'name email')
          .sort({ createdAt: -1 });
      }
    }
    // For HR admins - get all requests
    else if (userRole === 'hr' || userRole === 'admin') {
      requests = await LeaveRequest.find(queryFilter)
        .populate('employeeId', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 401 });
    }

    // Normalize records to ensure status has proper capitalization for consistent filtering
    const normalizedRequests = requests.map(request => {
      // If this is a Mongoose document, convert to plain object
      const plainRequest = request.toObject ? request.toObject() : { ...request };
      
      // Ensure status is properly capitalized if present
      if (plainRequest.status && typeof plainRequest.status === 'string') {
        const statusLower = plainRequest.status.toLowerCase();
        if (statusLower === 'pending') plainRequest.status = 'Pending';
        else if (statusLower === 'approved') plainRequest.status = 'Approved';
        else if (statusLower === 'rejected') plainRequest.status = 'Rejected';
      }
      
      return plainRequest;
    });

    return NextResponse.json({
      success: true,
      data: normalizedRequests
    });
  } catch (error) {
    console.error('Error in leave requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new leave request
export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.user.role !== 'employee') {
      return NextResponse.json(
        { error: 'Unauthorized - Only employees can create leave requests' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { leaveType, startDate, endDate, reason } = body;

    // Enhanced validation with specific messages
    if (!leaveType) {
      return NextResponse.json({ error: 'Leave type is required' }, { status: 400 });
    }

    // Validate leave type
    const validLeaveTypes = ['annual', 'sick', 'personal', 'other'];
    if (!validLeaveTypes.includes(leaveType)) {
      return NextResponse.json({ 
        error: 'Invalid leave type. Must be one of: ' + validLeaveTypes.join(', ') 
      }, { status: 400 });
    }

    if (!startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
    }

    if (!endDate) {
      return NextResponse.json({ error: 'End date is required' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Get employee details from database
    const employee = await Employee.findById(session.user.id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (start > end) {
      return NextResponse.json(
        { error: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: 'Cannot create leave requests for past dates' },
        { status: 400 }
      );
    }
    
    const request = await LeaveRequest.create({
      employeeId: session.user.id,
      employeeName: employee.name,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'Pending',
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Leave request submitted successfully',
      data: request
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating leave request:', error);
    
    // Handle specific database errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }
    
    if (error.name === 'MongooseError') {
      return NextResponse.json(
        { error: 'Database operation failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit leave request', details: error.message },
      { status: 500 }
    );
  }
}
