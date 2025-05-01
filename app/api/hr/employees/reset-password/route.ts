import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import connectToDatabase from "../../../../../lib/mongodb";
import Employee from "../../../../../models/Employee";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is authorized (HR role only)
    if (session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Access denied: HR access only' }, { status: 403 });
    }

    const { employeeIds, newPassword } = await request.json();
    
    // Validate input
    if (!employeeIds || !Array.isArray(employeeIds) || !newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid request format. Expected employee IDs array and new password." 
      }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: "Password must be at least 6 characters long."
      }, { status: 400 });
    }
    
    const results = [];
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    for (const employeeId of employeeIds) {
      try {
        const employee = await Employee.findById(employeeId);
        
        if (!employee) {
          results.push({
            success: false,
            employeeId,
            message: "Employee not found"
          });
          continue;
        }
        
        // Update employee password
        employee.password = hashedPassword;
        await employee.save();
        
        results.push({
          success: true,
          employeeId,
          message: "Password reset successfully"
        });
      } catch (err) {
        console.error(`Error resetting password for employee ${employeeId}:`, err);
        results.push({
          success: false,
          employeeId,
          message: "Failed to reset password"
        });
      }
    }
    
    return NextResponse.json({
      success: results.some(r => r.success),
      results
    });
  } catch (error) {
    console.error("Error in password reset:", error);
    return NextResponse.json({ 
      success: false, 
      error: "An error occurred while processing password reset request" 
    }, { status: 500 });
  }
}