import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';

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
    const employeeIdParam = url.searchParams.get('employeeId');
    
    // Get session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // For managers querying all employees' attendance by date
    if (dateParam && session.user.role === 'manager') {
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
    let employeeId = session.user.id;
    
    // Allow managers to query specific employee's data
    if (employeeIdParam && session.user.role === 'manager') {
      employeeId = employeeIdParam;
    } else if (session.user.role !== 'employee' && !employeeIdParam) {
      // Only employees can see their own records without specifying an ID
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
    }
    
    const { firstDay, lastDay } = getCurrentMonthDateRange();
    
    // Find employee and their attendance records
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    
    // Ensure attendance array exists
    if (!Array.isArray(employee.attendance)) {
      employee.attendance = [];
      await employee.save();
    }
    
    // Filter attendance records based on date parameter or default to current month
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
      // Default: filter for current month
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

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is an employee
    if (session.user.role !== 'employee') {
      return NextResponse.json({ error: 'Access denied: Employee access only' }, { status: 403 });
    }

    const employeeId = session.user.id;

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { action } = body;
    
    if (!action || !['clock-in', 'clock-out'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action: must be clock-in or clock-out' }, { status: 400 });
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Find and validate employee
    const employee = await Employee.findById(employeeId);
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
