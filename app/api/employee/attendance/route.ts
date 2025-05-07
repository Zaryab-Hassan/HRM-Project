import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';

// Define session types with extended properties to match our app requirements
interface ExtendedSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  }
}

// Function to get the current month's date range
function getCurrentMonthDateRange() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { firstDay, lastDay };
}

// Function to safely parse and format dates
function safeDateParse(dateString: string | Date): Date | null {
  if (!dateString) return null;
  
  try {
    return new Date(dateString);
  } catch (err) {
    console.error("Error parsing date:", err);
    return null;
  }
}

// GET endpoint to fetch attendance records
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Parse URL and get query parameters
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const employeeIdParam = url.searchParams.get('employeeId');
    
    // Use the proper way to get the session object that's compatible with your Next.js version
    const session = await getServerSession(authOptions);
    // Cast the session only after retrieving it
    const extendedSession = session as unknown as ExtendedSession;

    // Check if user is authenticated
    if (!extendedSession || !extendedSession.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // For managers querying all employees' attendance by date
    if (dateParam && extendedSession.user?.role === 'manager') {
      // Parse the date parameter
      const requestedDate = new Date(dateParam);
      const nextDay = new Date(requestedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Find all employees with attendance records for the requested date
      const employees = await Employee.find({});
      const result: Array<{
        employeeId: string;
        employeeName: string;
        department: string;
        date?: string;
        clockIn?: string;
        clockOut?: string;
        status?: string;
        hoursWorked?: number;
        autoClockOut?: boolean;
        notes?: string;
        [key: string]: any;
      }> = [];
      
      // Process each employee's attendance
      for (const employee of employees) {
        if (!Array.isArray(employee.attendance)) continue;
        
        // Find attendance records for the requested date
        const dateRecords = employee.attendance.filter((record: any) => {
          if (!record || !record.date) return false;
          const recordDate = safeDateParse(record.date);
          return recordDate && 
                 recordDate >= requestedDate && 
                 recordDate < nextDay;
        });
        
        // Add employee's attendance data to result
        dateRecords.forEach((record: any) => {
          result.push({
            employeeId: employee._id,
            employeeName: employee.name,
            department: employee.department,
            ...record._doc || record
          });
        });
      }
      
      return NextResponse.json({
        success: true,
        data: result
      });
    }
    
    // For single employee attendance records
    let employee;
    
    // Check if employee ID is provided in the query params
    if (employeeIdParam) {
      // Try to find employee by ID
      employee = await Employee.findById(employeeIdParam);
      
      // If ID lookup failed, try by email (for backward compatibility)
      if (!employee) {
        employee = await Employee.findOne({ email: employeeIdParam });
      }
      
      // If not a manager or HR, ensure the user can only access their own data
      if (extendedSession.user?.role !== 'manager' && extendedSession.user?.role !== 'hr') {
        const userEmail = extendedSession.user?.email;
        const userEmployee = await Employee.findOne({ email: userEmail });
        
        if (!userEmployee || userEmployee._id.toString() !== employee?._id.toString()) {
          return NextResponse.json({ error: 'Access denied: You can only view your own attendance records' }, { status: 403 });
        }
      }
    } else {
      // No employee ID provided, use the logged in user's email
      const userEmail = extendedSession.user?.email;
      employee = await Employee.findOne({ email: userEmail });
    }
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    
    // Default date range is current month
    let { firstDay, lastDay } = getCurrentMonthDateRange();
    
    // If start and end date parameters are provided, use them instead
    if (startDateParam && endDateParam) {
      const startDate = safeDateParse(startDateParam);
      let endDate = safeDateParse(endDateParam);
      
      if (startDate && endDate) {
        // Set end date to end of the day
        endDate = new Date(endDate.setHours(23, 59, 59, 999));
        firstDay = startDate;
        lastDay = endDate;
      }
    }
    
    // Ensure attendance array exists
    if (!Array.isArray(employee.attendance)) {
      employee.attendance = [];
      await employee.save();
    }
    
    // Filter attendance records based on date parameter or date range
    let filteredAttendance;
    if (dateParam) {
      const requestedDate = new Date(dateParam);
      const nextDay = new Date(requestedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filteredAttendance = employee.attendance.filter((record: any) => {
        if (!record || !record.date) return false;
        const recordDate = safeDateParse(record.date);
        return recordDate && 
               recordDate >= requestedDate && 
               recordDate < nextDay;
      });
    } else {
      // Filter based on date range (either provided or default)
      filteredAttendance = employee.attendance.filter((record: any) => {
        if (!record || !record.date) return false;
        const recordDate = safeDateParse(record.date);
        return recordDate && recordDate >= firstDay && recordDate <= lastDay;
      });
    }
    
    // Sort attendance records by date (newest first)
    const sortedAttendance = filteredAttendance.sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    return NextResponse.json({
      success: true,
      data: sortedAttendance
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}

// POST endpoint to record clock in/out
export async function POST(req: Request) {
  try {
    await dbConnect();

    // Use NextAuth session for authentication with type assertion
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is an employee or HR
    if (session.user.role !== 'employee' && session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Access denied: Only employees and HR can clock in/out' }, { status: 403 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { action, employeeId } = body;
    
    if (!action || !['clock-in', 'clock-out'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action: must be clock-in or clock-out' }, { status: 400 });
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Find employee - either by ID (if provided) or by email from session
    let employee;
    
    if (employeeId) {
      // If employee ID is provided in the request body, use it (for HR users clocking in/out)
      employee = await Employee.findById(employeeId);
    } else {
      // Otherwise use the logged in user's email
      const employeeEmail = session.user.email;
      employee = await Employee.findOne({ email: employeeEmail });
    }
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Initialize attendance array if it doesn't exist
    if (!Array.isArray(employee.attendance)) {
      employee.attendance = [];
    }

    // Find today's attendance record
    let todayRecord = employee.attendance.find((record: any) => {
      if (!record || !record.date) return false;
      try {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === todayStr;
      } catch (err) {
        console.error('Error parsing date:', err);
        return false;
      }
    });

    // Handle clock in
    if (action === 'clock-in') {
      if (todayRecord && todayRecord.clockIn) {
        return NextResponse.json({ error: 'Already clocked in for today' }, { status: 400 });
      }

      if (!todayRecord) {
        // Create new attendance record for today
        todayRecord = {
          date: now,
          clockIn: now,
          status: 'present'
        };
        employee.attendance.push(todayRecord);
      } else {
        todayRecord.clockIn = now;
        if (!todayRecord.status) todayRecord.status = 'present';
      }
    } 
    // Handle clock out
    else if (action === 'clock-out') {
      if (!todayRecord || !todayRecord.clockIn) {
        return NextResponse.json({ error: 'Must clock in before clocking out' }, { status: 400 });
      }
      
      if (todayRecord.clockOut) {
        return NextResponse.json({ error: 'Already clocked out for today' }, { status: 400 });
      }
      
      todayRecord.clockOut = now;
      
      // Calculate working hours if both clock-in and clock-out exist
      const clockInTime = new Date(todayRecord.clockIn).getTime();
      const clockOutTime = now.getTime();
      const workingMilliseconds = clockOutTime - clockInTime;
      
      // Convert to hours (rounded to 2 decimal places)
      todayRecord.hoursWorked = Math.round((workingMilliseconds / (1000 * 60 * 60)) * 100) / 100;
    }

    // Save changes
    try {
      await employee.save();
    } catch (error) {
      console.error('Error saving attendance record:', error);
      return NextResponse.json({ error: 'Failed to save attendance record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: todayRecord
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    );
  }
}
