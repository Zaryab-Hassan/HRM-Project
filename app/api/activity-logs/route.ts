import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define the Activity Log schema
const ActivityLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true },
  module: { type: String, required: true },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String }
});

// Create the model (only if it doesn't already exist)
const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);

// GET handler to retrieve activity logs
export async function GET(req: Request) {
  try {
    console.log('ActivityLogs API: Connecting to database...');
    await dbConnect();
    console.log('ActivityLogs API: Database connected successfully');

    // Use NextAuth session for authentication
    console.log('ActivityLogs API: Checking authentication...');
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error('ActivityLogs API: Authentication failed - No session found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }    // Check if user is authorized (manager or HR role only)
    console.log('ActivityLogs API: User authenticated with role:', session.user.role);
    
    if (session.user.role !== 'manager' && session.user.role !== 'hr') {
      console.error('ActivityLogs API: Authorization failed - User role is not manager or hr');
      return NextResponse.json({ error: 'Access denied: Manager or HR access only' }, { status: 403 });
    }
    
    console.log('ActivityLogs API: User authorized successfully');
    
    // Get query parameters
    const url = new URL(req.url);
    
    // Parse and validate query parameters
    const limitParam = url.searchParams.get('limit') || '100';
    const pageParam = url.searchParams.get('page') || '1';
    
    const limit = Math.max(1, parseInt(limitParam));
    const page = Math.max(1, parseInt(pageParam));
    
    console.log('ActivityLogs API: Pagination parameters:', { limit, page });
    
    // Ensure skip value is non-negative
    const skip = Math.max(0, (page - 1) * limit);
    console.log('ActivityLogs API: Skip value calculated:', skip);
      // Optional filters
    const filters: any = {};
    
    if (url.searchParams.get('userId')) {
      filters.userId = url.searchParams.get('userId');
    }
    
    if (url.searchParams.get('action')) {
      filters.action = url.searchParams.get('action');
    }
    
    if (url.searchParams.get('module')) {
      filters.module = url.searchParams.get('module');
    }
    
    if (url.searchParams.get('userRole')) {
      filters.userRole = url.searchParams.get('userRole');
    }
    
    if (url.searchParams.get('startDate') && url.searchParams.get('endDate')) {
      try {
        const startDate = new Date(url.searchParams.get('startDate') || '');
        const endDate = new Date(url.searchParams.get('endDate') || '');
        
        filters.timestamp = {
          $gte: startDate,
          $lte: endDate
        };
      } catch (dateError) {
        console.error('ActivityLogs API: Invalid date format in filter', dateError);
      }
    }
    
    console.log('ActivityLogs API: Query filters:', JSON.stringify(filters));    try {
      // Get total count for pagination
      console.log('ActivityLogs API: Counting total documents...');
      const total = await ActivityLog.countDocuments(filters);
      console.log('ActivityLogs API: Total documents count:', total);
      
      // Get the activity logs
      console.log('ActivityLogs API: Fetching activity logs...');
      const logs = await ActivityLog.find(filters)
        .sort({ timestamp: -1 }) // Newest first
        .skip(skip)
        .limit(limit)
        .lean(); // Convert MongoDB documents to plain JavaScript objects

      console.log(`ActivityLogs API: Successfully fetched ${logs.length} logs`);
      
      // Return logs with pagination metadata
      const response = {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
      
      return NextResponse.json(response);
    } catch (dbError) {
      console.error('ActivityLogs API: Database query error:', dbError);
      throw dbError;
    }  } catch (error) {
    console.error('ActivityLogs API: Error fetching activity logs:', error);
    
    // More descriptive error message based on the error type
    let errorMessage = 'Failed to fetch activity logs';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
      
      // Handle specific error cases
      if (error.message.includes('authentication') || error.message.includes('session')) {
        statusCode = 401;
      } else if (error.message.includes('access denied')) {
        statusCode = 403;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

// POST handler to create a new activity log
export async function POST(req: Request) {
  try {
    console.log('ActivityLogs API (POST): Connecting to database...');
    await dbConnect();
    console.log('ActivityLogs API (POST): Database connected successfully');

    // Use NextAuth session for authentication
    console.log('ActivityLogs API (POST): Checking authentication...');
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error('ActivityLogs API (POST): Authentication failed - No session found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log('ActivityLogs API (POST): User authenticated:', session.user.name, 'Role:', session.user.role);

    // Get the request body
    console.log('ActivityLogs API (POST): Parsing request body...');
    const body = await req.json();
    const { action, module, details, ipAddress } = body;
    
    console.log('ActivityLogs API (POST): Request body:', { action, module, details });
    
    // Validate required fields
    if (!action || !module || !details) {
      console.error('ActivityLogs API (POST): Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: action, module, and details are required' },
        { status: 400 }
      );
    }
    
    try {
      // Create a new activity log
      console.log('ActivityLogs API (POST): Creating new activity log...');
      
      const newLog = {
        userId: session.user.id,
        userName: session.user.name || 'Unknown User',
        userRole: session.user.role || 'unknown',
        action,
        module,
        details,
        ipAddress: ipAddress || req.headers.get('x-forwarded-for') || 'unknown',
        timestamp: new Date()
      };
      
      console.log('ActivityLogs API (POST): Log data to be saved:', newLog);
      
      const activityLog = await ActivityLog.create(newLog);
      console.log('ActivityLogs API (POST): Log created successfully with ID:', activityLog._id);

      return NextResponse.json(
        { success: true, data: activityLog },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('ActivityLogs API (POST): Error creating log:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('ActivityLogs API (POST): Error logging activity:', error);
    
    let errorMessage = 'Failed to log activity';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
      
      if (error.message.includes('validation') || error.message.includes('schema')) {
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
