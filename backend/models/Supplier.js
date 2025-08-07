const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [100, 'Supplier name cannot exceed 100 characters']
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  contactPerson: {
    name: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address'
      ]
    },
    position: {
      type: String,
      trim: true
    }
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'Nigeria'
    }
  },
  businessInfo: {
    taxId: {
      type: String,
      trim: true
    },
    registrationNumber: {
      type: String,
      trim: true
    },
    businessType: {
      type: String,
      enum: {
        values: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'other'],
        message: 'Please select a valid business type'
      },
      default: 'distributor'
    },
    specialties: [{
      type: String,
      trim: true
    }]
  },
  paymentTerms: {
    creditLimit: {
      type: Number,
      default: 0,
      min: [0, 'Credit limit cannot be negative']
    },
    paymentPeriod: {
      type: Number,
      default: 30,
      min: [0, 'Payment period cannot be negative']
    },
    currentBalance: {
      type: Number,
      default: 0,
      min: [0, 'Current balance cannot be negative']
    },
    lastPaymentDate: {
      type: Date
    },
    lastPaymentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Payment amount cannot be negative']
    }
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    website: {
      type: String,
      trim: true
    },
    fax: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['active', 'inactive', 'suspended', 'blacklisted'],
      message: 'Please select a valid status'
    },
    default: 'active'
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: 3
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: {
        values: ['license', 'certificate', 'contract', 'invoice', 'other'],
        message: 'Please select a valid document type'
      }
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPreferred: {
    type: Boolean,
    default: false
  },
  lastOrderDate: {
    type: Date
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: [0, 'Total orders cannot be negative']
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, 'Total spent cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function() {
  const address = this.address;
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
});

// Virtual for credit utilization
supplierSchema.virtual('creditUtilization').get(function() {
  if (this.paymentTerms.creditLimit > 0) {
    return ((this.paymentTerms.currentBalance / this.paymentTerms.creditLimit) * 100).toFixed(2);
  }
  return 0;
});

// Virtual for days since last payment
supplierSchema.virtual('daysSinceLastPayment').get(function() {
  if (!this.paymentTerms.lastPaymentDate) return null;
  const today = new Date();
  const lastPayment = new Date(this.paymentTerms.lastPaymentDate);
  return Math.ceil((today - lastPayment) / (1000 * 60 * 60 * 24));
});

// Virtual for average order value
supplierSchema.virtual('averageOrderValue').get(function() {
  if (this.totalOrders > 0) {
    return (this.totalSpent / this.totalOrders).toFixed(2);
  }
  return 0;
});

// Indexes for better query performance
supplierSchema.index({ name: 1 });
supplierSchema.index({ 'companyName': 1 });
supplierSchema.index({ 'contactPerson.email': 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ isPreferred: 1 });
supplierSchema.index({ 'businessInfo.businessType': 1 });

// Pre-save middleware to validate email format
supplierSchema.pre('save', function(next) {
  if (this.contactPerson.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(this.contactPerson.email)) {
    return next(new Error('Invalid contact person email format'));
  }
  next();
});

// Static method to find active suppliers
supplierSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find suppliers by business type
supplierSchema.statics.findByBusinessType = function(businessType) {
  return this.find({ 'businessInfo.businessType': businessType, status: 'active' });
};

// Static method to find suppliers with credit issues
supplierSchema.statics.findWithCreditIssues = function() {
  return this.find({
    $expr: {
      $and: [
        { $gt: ['$paymentTerms.creditLimit', 0] },
        { $gte: ['$paymentTerms.currentBalance', '$paymentTerms.creditLimit'] }
      ]
    }
  });
};

// Static method to find preferred suppliers
supplierSchema.statics.findPreferred = function() {
  return this.find({ isPreferred: true, status: 'active' });
};

// Instance method to update credit balance
supplierSchema.methods.updateCreditBalance = function(amount, operation = 'add') {
  if (operation === 'add') {
    this.paymentTerms.currentBalance += amount;
  } else if (operation === 'subtract') {
    this.paymentTerms.currentBalance = Math.max(0, this.paymentTerms.currentBalance - amount);
  }
  return this.save();
};

// Instance method to record payment
supplierSchema.methods.recordPayment = function(amount) {
  this.paymentTerms.lastPaymentAmount = amount;
  this.paymentTerms.lastPaymentDate = new Date();
  this.paymentTerms.currentBalance = Math.max(0, this.paymentTerms.currentBalance - amount);
  return this.save();
};

// Instance method to check credit limit
supplierSchema.methods.hasCreditAvailable = function(amount) {
  const availableCredit = this.paymentTerms.creditLimit - this.paymentTerms.currentBalance;
  return availableCredit >= amount;
};

// Instance method to update order statistics
supplierSchema.methods.updateOrderStats = function(orderAmount) {
  this.totalOrders += 1;
  this.totalSpent += orderAmount;
  this.lastOrderDate = new Date();
  return this.save();
};

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;