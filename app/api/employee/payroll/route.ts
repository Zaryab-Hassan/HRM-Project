import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import connectToDatabase from '../../../../lib/mongodb';
import PayrollRecord from '../../../../models/PayrollRecord';
import Employee from '../../../../models/Employee';

// GET handler to retrieve employee's own payroll records
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    // Find the employee by email
    const employee = await Employee.findOne({ email: session.user.email });
    
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const month = url.searchParams.get('month') || 'All';
    
    // Build query for this employee's records
    const query: any = { employeeId: employee._id };
    
    if (month !== 'All') {
      query.month = month;
    }
    
    // Get current month and year if not specified
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    
    // Fetch records
    let payrollRecords = await PayrollRecord.find(query).sort({ year: -1, month: -1 });
    
    // If no records found, create a placeholder record from employee data
    if (payrollRecords.length === 0) {
      const newRecord = new PayrollRecord({
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
      });
      
      await newRecord.save();
      payrollRecords = [newRecord];
    }
    
    return NextResponse.json({ success: true, data: payrollRecords });
  } catch (error) {
    console.error('Error fetching employee payroll records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll records' },
      { status: 500 }
    );
  }
}

// PATCH handler to toggle payroll status
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { recordId } = body;
    
    if (!recordId) {
      return NextResponse.json(
        { success: false, error: 'Record ID is required' },
        { status: 400 }
      );
    }
    
    // Find the employee by email
    const employee = await Employee.findOne({ email: session.user.email });
    
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Find the payroll record
    const payrollRecord = await PayrollRecord.findOne({
      _id: recordId,
      employeeId: employee._id // Ensure the record belongs to this employee
    });
    
    if (!payrollRecord) {
      return NextResponse.json(
        { success: false, error: 'Payroll record not found' },
        { status: 404 }
      );
    }
    
    // Toggle the status between 'Pending' and 'Paid'
    payrollRecord.status = payrollRecord.status === 'Pending' ? 'Paid' : 'Pending';
    
    // Save the updated record
    await payrollRecord.save();
    
    return NextResponse.json({
      success: true,
      data: payrollRecord
    });
  } catch (error) {
    console.error('Error updating payroll status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payroll status' },
      { status: 500 }
    );
  }
}