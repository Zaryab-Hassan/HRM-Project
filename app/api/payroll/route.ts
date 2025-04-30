import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import PayrollRecord from '../../../models/PayrollRecord';
import Employee from '../../../models/Employee';
import { getServerSession } from 'next-auth/next';

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
      const employeesInDepartment = await Employee.find({ department }).select('_id');
      const employeeIds = employeesInDepartment.map(emp => emp._id);
      query.employeeId = { $in: employeeIds };
    }
    
    // Get current month and year if not specified
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    
    // Fetch records
    let payrollRecords = await PayrollRecord.find(query).sort({ createdAt: -1 });
    
    // If no records found and no specific month filter, create records from employee data
    if (payrollRecords.length === 0 && (month === 'All' || month === currentMonth)) {
      const employees = await Employee.find({});
      
      if (employees.length > 0) {
        const newRecords = employees.map(employee => ({
          employeeId: employee._id,
          name: employee.name,
          position: employee.role,
          baseSalary: employee.currentSalary,
          bonuses: 0,
          deductions: 0,
          netSalary: employee.currentSalary,
          status: 'Pending',
          month: currentMonth,
          year: currentYear
        }));
        
        await PayrollRecord.insertMany(newRecords);
        payrollRecords = await PayrollRecord.find(query).sort({ createdAt: -1 });
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
    const { id, baseSalary, bonuses, deductions, status } = body;
    
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
    if (deductions !== undefined) payrollRecord.deductions = deductions;
    
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