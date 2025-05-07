import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import connectToDatabase from "../../../../../lib/mongodb";
import Employee from "../../../../../models/Employee";

// Define interface for the session type
interface CustomSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
    role?: string;
  };
}

// PATCH handler to update employee status
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();

    // Updated getServerSession call to use the correct pattern
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is authorized (HR role only)
    if (session?.user?.role !== 'hr') {
      return NextResponse.json({ error: 'Access denied: HR access only' }, { status: 403 });
    }

    const { employeeId, status } = await request.json();
    
    // Validate input
    if (!employeeId) {
      return NextResponse.json({ 
        success: false, 
        error: "Employee ID is required" 
      }, { status: 400 });
    }
    
    if (!status) {
      return NextResponse.json({ 
        success: false, 
        error: "Status is required" 
      }, { status: 400 });
    }
    
    // Check if status is valid
    const validStatuses = ['Active', 'On Leave', 'Terminated'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }
    
    // Update employee status
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { status },
      { new: true }
    ).select('-password');
    
    if (!updatedEmployee) {
      return NextResponse.json({ 
        success: false, 
        error: "Employee not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Employee status updated successfully",
      data: updatedEmployee
    });
  } catch (error) {
    console.error("Error updating employee status:", error);
    return NextResponse.json({ 
      success: false, 
      error: "An error occurred while updating employee status" 
    }, { status: 500 });
  }
}