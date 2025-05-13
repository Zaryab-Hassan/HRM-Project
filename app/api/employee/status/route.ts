import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';

// Gets an employee's status
export async function GET(req: Request) {
  try {
    await dbConnect();

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log('No authenticated session found when checking employee status');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the employee id from the session
    const employeeId = session.user.id;
    console.log(`Checking employee status for ID: ${employeeId}`);
    
    if (!employeeId) {
      console.log('Missing employee ID in session');
      return NextResponse.json({ error: 'Employee ID not found in session' }, { status: 400 });
    }
    
    // Get employee data
    const employee = await Employee.findById(employeeId).select('-password');
    if (!employee) {
      console.log(`Employee not found with ID: ${employeeId}`);
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Calculate attendance percentage (dummy data - should be replaced with actual calculation)
    const attendance = '85%';
    
    // Get leaves data
    const leavesRemaining = employee.leavesRemaining || 20;
    const leavesTaken = employee.leavesTaken || 0;
    
    // Get salary information (using currentSalary from employee model)
    const salary = employee.currentSalary || 0;
    const recentPayments = employee.recentPayments || [];
    
    return NextResponse.json({
      success: true,
      status: employee.status, // Include the employee's status in the response
      attendance,
      leavesRemaining,
      leavesTaken,
      salary,
      recentPayments
    });
    
  } catch (error) {
    console.error('Error fetching employee status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee status' },
      { status: 500 }
    );
  }
}

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
