import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import connectToDatabase from '../../../../../lib/mongodb';
import PayrollRecord from '../../../../../models/PayrollRecord';
import Employee from '../../../../../models/Employee';

export async function POST(request: NextRequest) {
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
    
    // Get the record ID from the request body
    const { recordId } = await request.json();
    
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
      employeeId: employee._id
    }).populate('employeeId');
    
    if (!payrollRecord) {
      return NextResponse.json(
        { success: false, error: 'Payroll record not found' },
        { status: 404 }
      );
    }
    
    if (payrollRecord.status !== 'Paid') {
      return NextResponse.json(
        { success: false, error: 'Payslip is only available for paid salaries' },
        { status: 403 }
      );
    }
    
    // Prepare payslip data
    const payslipData = {
      employeeName: payrollRecord.name,
      position: payrollRecord.position,
      month: payrollRecord.month,
      year: payrollRecord.year,
      baseSalary: payrollRecord.baseSalary,
      bonuses: payrollRecord.bonuses,
      bonusDescription: payrollRecord.bonusDescription || '',
      deductions: payrollRecord.deductions,
      deductionDescription: payrollRecord.deductionDescription || '',
      netSalary: payrollRecord.netSalary,
      paymentDate: payrollRecord.paymentDate || new Date(),
      employeeId: employee._id
    };
    
    return NextResponse.json({
      success: true,
      data: payslipData
    });
  } catch (error) {
    console.error('Error generating payslip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate payslip' },
      { status: 500 }
    );
  }
}