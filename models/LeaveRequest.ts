import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
    default: null
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },  leaveType: {
    type: String,
    required: true,
    enum: ['annual', 'sick', 'personal', 'other']
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const LeaveRequest = mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', leaveRequestSchema, 'leaveRequest.db');

export default LeaveRequest;
