import { NextResponse, NextRequest } from "next/server";
import connectToDatabase from "../../../../../lib/mongodb";
import Employee from "../../../../../models/Employee";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { updates } = await request.json();
    
    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid request format. Expected an array of updates." 
      }, { status: 400 });
    }
    
    const results = [];
    
    for (const update of updates) {
      const { employeeId, additionalLeaves } = update;
      
      if (!employeeId || typeof additionalLeaves !== 'number') {
        results.push({
          success: false,
          employeeId: employeeId || 'unknown',
          message: "Invalid update data"
        });
        continue;
      }
      
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
        
        // Get current leave count or default to 14
        const currentLeaves = employee.totalLeaves || 14;
        const newLeaveCount = currentLeaves + additionalLeaves;
        
        // Update employee with new leave count
        employee.totalLeaves = newLeaveCount;
        await employee.save();
        
        results.push({
          success: true,
          employeeId,
          message: `Leave allocation updated successfully`,
          newLeaveCount
        });
      } catch (err) {
        console.error(`Error updating employee ${employeeId}:`, err);
        results.push({
          success: false,
          employeeId,
          message: "Failed to update employee record"
        });
      }
    }
    
    return NextResponse.json({
      success: results.some(r => r.success),
      results
    });
  } catch (error) {
    console.error("Error in leave allocation update:", error);
    return NextResponse.json({ 
      success: false, 
      message: "An error occurred while processing leave allocation updates" 
    }, { status: 500 });
  }
}