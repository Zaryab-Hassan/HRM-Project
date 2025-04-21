import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Employee from "@/models/Employee";
import LeaveRequest from "@/models/LeaveRequest";
import Manager from "@/models/Manager";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        await connectToDatabase();
        
        // Get session first using NextAuth
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // Verify user role from session
        if (session.user.role !== 'manager') {
            return NextResponse.json({ error: "Unauthorized - Manager access only" }, { status: 403 });
        }
        
        // Get manager's team first since we need it for multiple queries
        const manager = await Manager.findById(session.user.id).populate('team');
        if (!manager) {
            return NextResponse.json({ error: "Manager not found" }, { status: 404 });
        }
        
        // Get total employees (count from database)
        const totalEmployees = await Employee.countDocuments({ status: 'Active' });
        
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Find employees who have clocked in today and haven't clocked out yet
        const employees = await Employee.find({}, 'name status attendance dob');
        
        // Count attendance statistics
        let todayPresent = 0;
        let todayAbsent = 0;
        let todayOnLeave = 0;
        
        // Process each employee
        for (const employee of employees) {
            if (employee.status === 'On Leave') {
                todayOnLeave++;
                continue;
            }
            
            if (employee.status === 'Terminated') {
                continue;
            }
            
            // Check if employee has attendance records for today
            if (Array.isArray(employee.attendance)) {
                const todayRecord = employee.attendance.find((record: { date?: Date | string; clockIn?: Date | string; clockOut?: Date | string }) => {
                    if (!record || !record.date) return false;
                    const recordDate = new Date(record.date);
                    return recordDate >= today && recordDate < tomorrow;
                });
                
                if (todayRecord && todayRecord.clockIn) {
                    todayPresent++;
                } else {
                    todayAbsent++;
                }
            } else {
                todayAbsent++;
            }
        }
        
        // Get pending leave requests
        const pendingLeaves = await LeaveRequest.countDocuments({
            status: 'Pending'
        });
        
        // Calculate attendance metrics for the month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const workDaysInMonth = getBusinessDaysCount(startOfMonth, endOfMonth);
        
        // Calculate absenteeism rate (absent days / total work days)
        const totalAbsences = await calculateTotalAbsences(startOfMonth, endOfMonth);
        const absenteeismRate = Math.round((totalAbsences / (totalEmployees * workDaysInMonth)) * 100);
        
        // Calculate average attendance rate
        const averageAttendance = 100 - absenteeismRate;
        
        // Calculate total leaves for the month
        const totalLeaves = await LeaveRequest.countDocuments({
            startDate: { $gte: startOfMonth },
            endDate: { $lte: endOfMonth },
            status: 'Approved'
        });
        
        // Get today's birthdays
        const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
        const currentDay = today.getDate();
        
        const birthdaysToday = employees
            .filter(employee => {
                if (!employee.dob) return false;
                const dob = new Date(employee.dob);
                return dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay;
            })
            .map(employee => employee.name);
        
        // Get total payroll (placeholder calculation - in a real app, this would be more complex)
        const totalPayroll = await calculateTotalPayroll();
        
        return NextResponse.json({
            totalEmployees,
            presentToday: todayPresent,
            todayAbsent,
            todayOnLeave,
            pendingLeaves,
            averageAttendance,
            absenteeismRate,
            totalLeaves,
            birthdaysToday,
            totalPayroll
        });
    } catch (error) {
        console.error("Error in summary endpoint:", error);
        return NextResponse.json(
            { error: "Failed to fetch summary statistics" },
            { status: 500 }
        );
    }
}

// Helper function to count business days between two dates
function getBusinessDaysCount(startDate: Date, endDate: Date) {
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
}

// Helper function to calculate total absences in a date range
async function calculateTotalAbsences(startDate: Date, endDate: Date) {
    // This is a simplified calculation
    // In a real system, you might need to query the database for actual absence records
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });
    return Math.floor(activeEmployees * 0.1 * getBusinessDaysCount(startDate, endDate)); // Assuming 10% absence rate
}

// Helper function to calculate total payroll
async function calculateTotalPayroll() {
    try {
        const employees = await Employee.find({ status: 'Active' }, 'currentSalary');
        const totalSalary = employees.reduce((sum, emp) => 
            sum + (parseInt(emp.currentSalary) || 0), 0);
        return totalSalary;
    } catch (error) {
        console.error("Error calculating payroll:", error);
        return 0;
    }
}
