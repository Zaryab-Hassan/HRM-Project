import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Manager from '@/models/Manager';

// Helper function to format employee data for display
function formatEmployeeData(employee: any) {
  // Creating a cloned object to avoid modifying the original mongoose document
  const formattedEmployee = JSON.parse(JSON.stringify(employee));
  
  // Format dates for better display
  if (formattedEmployee.dob) {
    formattedEmployee.formattedDob = new Date(formattedEmployee.dob).toLocaleDateString();
  }
  
  if (formattedEmployee.joiningDate) {
    formattedEmployee.formattedJoiningDate = new Date(formattedEmployee.joiningDate).toLocaleDateString();
  }
  
  // Calculate service duration
  if (formattedEmployee.joiningDate) {
    const joinDate = new Date(formattedEmployee.joiningDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    formattedEmployee.serviceDuration = years > 0 
      ? `${years} year${years > 1 ? 's' : ''}${months > 0 ? `, ${months} month${months > 1 ? 's' : ''}` : ''}` 
      : `${months} month${months > 1 ? 's' : ''}`;
  }
  
  // Calculate leave statistics
  if (Array.isArray(formattedEmployee.leaves)) {
    const approvedLeaves = formattedEmployee.leaves.filter((leave: any) => leave.status === 'approved').length;
    const pendingLeaves = formattedEmployee.leaves.filter((leave: any) => leave.status === 'pending').length;
    
    formattedEmployee.leaveStats = {
      approved: approvedLeaves,
      pending: pendingLeaves,
      total: formattedEmployee.leaves.length
    };
  }
  
  return formattedEmployee;
}

// Retrieves employee data based on user role
export async function GET(req: Request) {
  try {
    await dbConnect();

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userEmail = session.user.email;
    const userRole = session.user.role;
    
    // Parse the request URL to get query parameters
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('id');
    
    let employees = [];
    
    // If an employee ID is provided, fetch just that employee (managers and HR only)
    if (employeeId && (userRole === 'hr' || userRole === 'manager')) {
      const employee = await Employee.findById(employeeId).select('-password');
      
      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
      
      employees = [employee];
    }
    // For HR, fetch all employees
    else if (userRole === 'hr') {
      employees = await Employee.find()
        .select('-password')
        .sort({ name: 1 });
    }    // For managers, fetch all employees (modified to show all employees, not just team members)
    else if (userRole === 'manager') {
      // No longer restricting to team members
      employees = await Employee.find()
        .select('-password')
        .sort({ name: 1 });
    }
    // For employees, fetch only their own data
    else if (userRole === 'employee') {
      const employee = await Employee.findOne({ email: userEmail })
        .select('-password');
        
      if (employee) {
        employees = [employee];
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    // Format the data for display
    const formattedEmployees = employees.map(formatEmployeeData);

    return NextResponse.json({
      success: true,
      count: formattedEmployees.length,
      data: formattedEmployees
    });
    
  } catch (error) {
    console.error('Error fetching employees data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees data' },
      { status: 500 }
    );
  }
}
