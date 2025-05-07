import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import connectToDatabase from '@/lib/mongodb';
import Employee from '@/models/Employee';
import PayrollRecord from '@/models/PayrollRecord';
import mongoose from 'mongoose';

// GET handler to retrieve payroll records
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Parse query parameters
    const url = new URL(request.url);
    const month = url.searchParams.get('month') || 'All';
    const searchTerm = url.searchParams.get('search') || '';
    const department = url.searchParams.get('department') || 'All';
    
    // Build query
    const query: any = {};
    
    if (month !== 'All') {
      query.month = month;
    }
    
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (department !== 'All') {
      // If department filter is applied, join with Employee collection to filter by department
      const employeesInDepartment = await Employee.find({ department, status: { $ne: 'Terminated' } }).select('_id');
      const employeeIds: mongoose.Types.ObjectId[] = employeesInDepartment.map((emp: { _id: mongoose.Types.ObjectId }) => emp._id);
      query.employeeId = { $in: employeeIds };
    }
    
    // Get current month and year if not specified
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    
    // Fetch records - exclude records for terminated employees
    let payrollRecords;
    
    // First fetch all active employees to get their IDs
    const activeEmployees = await Employee.find({ status: { $ne: 'Terminated' } }).select('_id name');
    const activeEmployeeIds = activeEmployees.map((emp: { _id: mongoose.Types.ObjectId; name: string }) => emp._id);
    
    // Add this filter to only get payroll records for active employees
    const activeEmployeeQuery = { ...query, employeeId: { $in: activeEmployeeIds } };
    
    // Now fetch payroll records only for active employees
    payrollRecords = await PayrollRecord.find(activeEmployeeQuery).sort({ createdAt: -1 });
    
    // If no records found and no specific month filter, create records from employee data (only for active employees)
    if (payrollRecords.length === 0 && (month === 'All' || month === currentMonth)) {
      // Only get active employees
      const employees = await Employee.find({ status: { $ne: 'Terminated' } });
      
      if (employees.length > 0) {
        const newRecords = employees.map((employee: any) => ({
          employeeId: employee._id,
          name: employee.name,
          position: employee.role,
          baseSalary: employee.currentSalary,
          bonuses: 0,
          bonusDescription: '',
          deductions: 0,
          deductionDescription: '',
          netSalary: employee.currentSalary,
          status: 'Pending',
          month: currentMonth,
          year: currentYear
        }));
        
        await PayrollRecord.insertMany(newRecords);
        payrollRecords = await PayrollRecord.find(activeEmployeeQuery).sort({ createdAt: -1 });
      }
    }
    
    return NextResponse.json({ success: true, data: payrollRecords });
  } catch (error) {
    console.error('Error fetching payroll records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll records' },
      { status: 500 }
    );
  }
}

// PATCH handler to update a payroll record
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { id, baseSalary, bonuses, bonusDescription, deductions, deductionDescription, status } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Record ID is required' },
        { status: 400 }
      );
    }
    
    const payrollRecord = await PayrollRecord.findById(id);
    
    if (!payrollRecord) {
      return NextResponse.json(
        { success: false, error: 'Payroll record not found' },
        { status: 404 }
      );
    }
    
    // Update record
    if (baseSalary !== undefined) payrollRecord.baseSalary = baseSalary;
    if (bonuses !== undefined) payrollRecord.bonuses = bonuses;
    if (bonusDescription !== undefined) payrollRecord.bonusDescription = bonusDescription;
    if (deductions !== undefined) payrollRecord.deductions = deductions;
    if (deductionDescription !== undefined) payrollRecord.deductionDescription = deductionDescription;
    
    // Update status if provided
    if (status !== undefined) {
      // Validate status value
      if (!['Paid', 'Pending', 'Processing'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        );
      }
      payrollRecord.status = status;
    }
    
    // Save record (middleware will update netSalary)
    await payrollRecord.save();
    
    return NextResponse.json({
      success: true,
      data: payrollRecord
    });
  } catch (error) {
    console.error('Error updating payroll record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payroll record' },
      { status: 500 }
    );
  }
}