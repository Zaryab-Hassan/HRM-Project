import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
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
    default: 'admin',
  },
  superAdmin: {
    type: Boolean,
    default: false,
  },
  permissions: {
    canManageUsers: {
      type: Boolean,
      default: true,
    },
    canManageRoles: {
      type: Boolean,
      default: true,
    },
    canManageSettings: {
      type: Boolean,
      default: true,
    },
    canViewAuditLogs: {
      type: Boolean,
      default: true,
    },
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
}, { collection: 'admin.db' });

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to check password
adminSchema.methods.comparePassword = async function(password: string) {
  return bcrypt.compare(password, this.password);
};

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
export default Admin;
