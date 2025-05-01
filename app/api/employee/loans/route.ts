import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';

// Define the loan application schema (this would typically be in its own model file)
const LoanSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  loanType: {
    type: String,
    enum: ['personal', 'education', 'medical', 'housing', 'emergency'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true
  },
  durationMonths: {
    type: Number,
    required: true,
    min: 1,
    max: 60
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0
  },
  monthlyInstallment: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Paid'],
    default: 'Pending'
  },
  approvedAt: {
    type: Date
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Check if model already exists to prevent OverwriteModelError during hot reload
const LoanApplication = mongoose.models.LoanApplication || mongoose.model('LoanApplication', LoanSchema);

// GET handler for fetching loan applications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse URL params
    const url = new URL(req.url);
    const year = url.searchParams.get('year');
    const status = url.searchParams.get('status');
    const id = url.searchParams.get('id');
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Different behavior based on user role
    const isManager = session.user.role === 'manager' || session.user.role === 'hr';
    
    // Build query based on session user and filters
    let query: any = {};
    
    // If manager/HR is requesting all applications or specific status
    if (isManager) {
      // If specific loan ID is requested
      if (id) {
        query._id = id;
      }
      
      // Status filter for managers
      if (status && status !== 'all') {
        query.status = status;
      }
    } else {
      // Regular employees can only see their own applications
      query.employeeId = session.user.id;
    }
    
    // Add year filter if provided
    if (year) {
      const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }
    
    // Fetch loan applications
    let loanApplications;
    
    if (isManager) {
      // For managers, include employee information by populating the employeeId field
      loanApplications = await LoanApplication.find(query)
        .populate('employeeId', 'name email department') // Populate with employee fields
        .sort({ createdAt: -1 });
        
      // Transform the data to match the expected format in the frontend
      loanApplications = loanApplications.map(loan => {
        const loanObj = loan.toObject();
        return {
          ...loanObj,
          employeeName: loanObj.employeeId.name,
          employeeEmail: loanObj.employeeId.email,
          employeeDepartment: loanObj.employeeId.department,
          employeeId: loanObj.employeeId._id
        };
      });
    } else {
      // For employees, just get their own loans
      loanApplications = await LoanApplication.find(query).sort({ createdAt: -1 });
    }
    
    // For employees, calculate loan balance statistics
    let balanceStats = null;
    if (!isManager) {
      const approved = await LoanApplication.aggregate([
        { $match: { employeeId: new mongoose.Types.ObjectId(session.user.id), status: 'Approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const paid = await LoanApplication.aggregate([
        { $match: { employeeId: new mongoose.Types.ObjectId(session.user.id), status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      // Calculate outstanding balance (approved - paid)
      const totalApproved = approved.length > 0 ? approved[0].total : 0;
      const totalPaid = paid.length > 0 ? paid[0].total : 0;
      const totalOutstanding = totalApproved - totalPaid;
      
      balanceStats = {
        totalOutstanding,
        totalApproved,
        totalPaid
      };
    }
    
    return NextResponse.json({
      success: true,
      data: loanApplications,
      balance: balanceStats
    });
    
  } catch (error) {
    console.error('Error fetching loan applications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loan applications' },
      { status: 500 }
    );
  }
}

// POST handler for creating a new loan application
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const { loanType, amount, reason, durationMonths, interestRate, monthlyInstallment } = body;
    
    // Validate required fields
    if (!loanType || amount <= 0 || !reason || durationMonths <= 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Create new loan application
    const newLoanApplication = new LoanApplication({
      employeeId: session.user.id,
      loanType,
      amount,
      reason,
      durationMonths,
      interestRate,
      monthlyInstallment,
      status: 'Pending',
      createdAt: new Date()
    });
    
    // Save to database
    await newLoanApplication.save();
    
    return NextResponse.json({
      success: true,
      data: newLoanApplication,
      message: 'Loan application submitted successfully'
    });
    
  } catch (error) {
    console.error('Error creating loan application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit loan application' },
      { status: 500 }
    );
  }
}

// DELETE handler for canceling a pending loan application
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse URL params
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Loan application ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Find the loan application
    const loanApplication = await LoanApplication.findById(id);
    
    // Check if loan application exists
    if (!loanApplication) {
      return NextResponse.json(
        { success: false, error: 'Loan application not found' },
        { status: 404 }
      );
    }
    
    // Check if the loan application belongs to the current user
    if (loanApplication.employeeId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to delete this loan application' },
        { status: 403 }
      );
    }
    
    // Check if the loan application is in 'Pending' status
    if (loanApplication.status !== 'Pending') {
      return NextResponse.json(
        { success: false, error: 'Only pending applications can be deleted' },
        { status: 400 }
      );
    }
    
    // Delete the loan application
    await LoanApplication.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Loan application deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting loan application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete loan application' },
      { status: 500 }
    );
  }
}

// PATCH handler for updating loan application status (approve/reject)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only managers and HR can update loan status
    if (session.user.role !== 'manager' && session.user.role !== 'hr') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only managers can update loan application status' 
      }, { status: 403 });
    }
    
    // Parse request body
    const body = await req.json();
    const { id, status } = body;
    
    // Validate required fields
    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Loan ID and status are required' },
        { status: 400 }
      );
    }
    
    // Status must be either Approved or Rejected
    if (status !== 'Approved' && status !== 'Rejected') {
      return NextResponse.json(
        { success: false, error: 'Status must be either Approved or Rejected' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Find the loan application
    const loanApplication = await LoanApplication.findById(id);
    
    // Check if loan application exists
    if (!loanApplication) {
      return NextResponse.json(
        { success: false, error: 'Loan application not found' },
        { status: 404 }
      );
    }
    
    // Only pending applications can be approved/rejected
    if (loanApplication.status !== 'Pending') {
      return NextResponse.json(
        { success: false, error: 'Only pending applications can be updated' },
        { status: 400 }
      );
    }
    
    // Update the loan application status
    loanApplication.status = status;
    
    // If approved, set approval date
    if (status === 'Approved') {
      loanApplication.approvedAt = new Date();
      
      // Set start date to current date and calculate end date based on duration
      loanApplication.startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + loanApplication.durationMonths);
      loanApplication.endDate = endDate;
    }
    
    // Save changes
    await loanApplication.save();
    
    return NextResponse.json({
      success: true,
      data: loanApplication,
      message: `Loan application ${status.toLowerCase()} successfully`
    });
    
  } catch (error) {
    console.error('Error updating loan application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update loan application' },
      { status: 500 }
    );
  }
}