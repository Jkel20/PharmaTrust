const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated user ID
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *         role:
 *           type: string
 *           enum: [admin, pharmacist, cashier]
 *           description: User's role in the system
 *         isActive:
 *           type: boolean
 *           description: Whether the user account is active
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
    validate: {
      validator: function(value) {
        return /^[a-zA-Z\s]+$/.test(value);
      },
      message: 'First name should only contain letters and spaces'
    }
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    validate: {
      validator: function(value) {
        return /^[a-zA-Z\s]+$/.test(value);
      },
      message: 'Last name should only contain letters and spaces'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(phone) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone);
      },
      message: 'Please provide a valid phone number'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(password) {
        // Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'pharmacist', 'cashier'],
      message: 'Role must be either admin, pharmacist, or cashier'
    },
    required: [true, 'User role is required'],
    default: 'cashier'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'Ghana'
    }
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    }
  },
  employeeDetails: {
    employeeId: {
      type: String,
      unique: true,
      sparse: true
    },
    department: {
      type: String,
      trim: true
    },
    position: {
      type: String,
      trim: true
    },
    salary: {
      type: Number,
      min: 0
    },
    hireDate: {
      type: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'employeeDetails.employeeId': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
    fullName: this.fullName
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.loginAttempts = 0;
  this.lockUntil = null;
  return this.save();
};

// Instance method to handle failed login attempts
userSchema.methods.handleFailedLogin = async function() {
  // If account is already locked, just return
  if (this.lockUntil && this.lockUntil > Date.now()) {
    return;
  }

  this.loginAttempts += 1;

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + (2 * 60 * 60 * 1000); // 2 hours
  }

  return this.save();
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
