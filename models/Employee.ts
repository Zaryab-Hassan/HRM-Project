import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Attendance record schema
const attendanceRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  clockIn: {
    type: Date
  },
  clockOut: {
    type: Date
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'leave'],
    default: 'present'
  },
  hoursWorked: {
    type: Number
  },
  autoClockOut: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  }
});

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cnic: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  emergencyContact: {
    type: String,
    required: true
  },
  dob: {
    type: Date,
    required: true
  },
  initialSalary: {
    type: Number,
    required: true
  },
  currentSalary: {
    type: Number,
    required: true
  },
  shift: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date
  },
  password: {
    type: String,
    required: true
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
    default: null
  },  
  managerAssignedDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Terminated'],
    default: 'Active'
  },
  attendance: [attendanceRecordSchema],
  leaves: [{
    startDate: Date,
    endDate: Date,
    type: String,
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalLeaves: {
    type: Number,
    default: 14  // Default allowed leaves per year
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'employee.db' });

// Hash password before saving
employeeSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
employeeSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to assign manager
employeeSchema.methods.assignManager = async function(managerId: mongoose.Types.ObjectId) {
  this.managerId = managerId;
  this.managerAssignedDate = new Date();
  await this.save();
};

// Method to remove manager
employeeSchema.methods.removeManager = async function() {
  this.managerId = null;
  this.managerAssignedDate = null;
  await this.save();
};

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema, 'employee.db');

export default Employee;
