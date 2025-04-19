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
        }        // Get total employees (count from database)
        const totalEmployees = await Employee.countDocuments({ status: 'Active' });
        
        // Get present employees by checking today's attendance records
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
          // Find employees who have clocked in today and haven't clocked out yet
        const presentToday = await Employee.countDocuments({
            status: 'Active',
            'attendance.date': { 
                $gte: today, 
                $lt: tomorrow 
            },
            'attendance.clockIn': { $ne: null },
            'attendance.clockOut': null  // Only count employees who haven't clocked out
        });
          // Get pending leaves for all employees
        const pendingLeaves = await LeaveRequest.countDocuments({
            status: 'Pending'
        });
        
        // Get all employees with birthdays today
        const birthdaysToday = await Employee.find({
            $expr: {
                $and: [
                    { $eq: [{ $dayOfMonth: "$dateOfBirth" }, { $dayOfMonth: new Date() }] },
                    { $eq: [{ $month: "$dateOfBirth" }, { $month: new Date() }] }
                ]
            }
        }).select('firstName lastName');
        
        // Calculate total payroll (you might want to adjust this based on your needs)
        const employees = await Employee.find();
        const totalPayroll = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);

        return NextResponse.json({
            totalEmployees,
            presentToday,
            pendingLeaves,
            totalPayroll,
            birthdaysToday: birthdaysToday.map(emp => `${emp.firstName} ${emp.lastName}`)
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch summary statistics" },
            { status: 500 }
        );
    }
}
