import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const managerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'manager',
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  department: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Terminated'],
    default: 'Active',
  },
  permissions: {
    canManageLeaves: {
      type: Boolean,
      default: true,
    },
    canManageAttendance: {
      type: Boolean,
      default: true,
    },
    canManagePayroll: {
      type: Boolean,
      default: false,
    }
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  }
}, { collection: 'manager.db' });

// Hash password before saving
managerSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to check password
managerSchema.methods.comparePassword = async function(password: string) {
  return bcrypt.compare(password, this.password);
};

// Add method to add employee to team
managerSchema.methods.addTeamMember = async function(employeeId: mongoose.Types.ObjectId) {
  if (!this.team.includes(employeeId)) {
    this.team.push(employeeId);
    await this.save();
  }
};

// Add method to remove employee from team
managerSchema.methods.removeTeamMember = async function(employeeId: mongoose.Types.ObjectId) {
this.team = this.team.filter((id: mongoose.Types.ObjectId) => !id.equals(employeeId));
  await this.save();
};

const Manager = mongoose.models.Manager || mongoose.model('Manager', managerSchema, "manager.db");
export default Manager;
