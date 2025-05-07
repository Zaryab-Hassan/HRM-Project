import mongoose from 'mongoose';

const payrollRecordSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  bonuses: {
    type: Number,
    default: 0
  },
  bonusDescription: {
    type: String,
    default: ''
  },
  deductions: {
    type: Number,
    default: 0
  },
  deductionDescription: {
    type: String,
    default: ''
  },
  netSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Processing'],
    default: 'Pending'
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'payroll.db' });

// Middleware to update netSalary before saving
payrollRecordSchema.pre('save', function(next) {
  this.netSalary = this.baseSalary + this.bonuses - this.deductions;
  this.updatedAt = new Date();
  next();
});

const PayrollRecord = mongoose.models.PayrollRecord || mongoose.model('PayrollRecord', payrollRecordSchema, 'payroll.db');

export default PayrollRecord;