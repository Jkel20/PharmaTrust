const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Supplier:
 *       type: object
 *       required:
 *         - name
 *         - contactPerson
 *         - email
 *         - phoneNumber
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated supplier ID
 *         name:
 *           type: string
 *           description: Supplier company name
 *         contactPerson:
 *           type: string
 *           description: Primary contact person name
 *         email:
 *           type: string
 *           format: email
 *           description: Supplier email address
 *         phoneNumber:
 *           type: string
 *           description: Primary phone number
 *         alternatePhone:
 *           type: string
 *           description: Alternative phone number
 *         address:
 *           type: object
 *           description: Supplier address details
 *         creditLimit:
 *           type: number
 *           description: Maximum credit allowed
 *         currentCredit:
 *           type: number
 *           description: Current outstanding credit
 *         paymentTerms:
 *           type: string
 *           description: Payment terms (e.g., Net 30)
 *         isActive:
 *           type: boolean
 *           description: Whether supplier is active
 */

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [100, 'Supplier name cannot exceed 100 characters'],
    index: true
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [50, 'Registration number cannot exceed 50 characters']
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person is required'],
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters']
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
  alternatePhone: {
    type: String,
    validate: {
      validator: function(phone) {
        return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
      },
      message: 'Please provide a valid alternate phone number'
    }
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(url) {
        return !url || /^https?:\/\/.+$/.test(url);
      },
      message: 'Please provide a valid website URL'
    }
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [50, 'State name cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Zip code cannot exceed 20 characters']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [50, 'Country name cannot exceed 50 characters'],
      default: 'Ghana'
    }
  },
  bankDetails: {
    bankName: {
      type: String,
      trim: true,
      maxlength: [100, 'Bank name cannot exceed 100 characters']
    },
    accountNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Account number cannot exceed 50 characters']
    },
    routingNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Routing number cannot exceed 50 characters']
    },
    accountName: {
      type: String,
      trim: true,
      maxlength: [100, 'Account name cannot exceed 100 characters']
    }
  },
  creditLimit: {
    type: Number,
    min: [0, 'Credit limit cannot be negative'],
    default: 0,
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'Credit limit must be a positive number'
    }
  },
  currentCredit: {
    type: Number,
    min: [0, 'Current credit cannot be negative'],
    default: 0,
    validate: {
      validator: function(value) {
        return value <= this.creditLimit;
      },
      message: 'Current credit cannot exceed credit limit'
    }
  },
  paymentTerms: {
    type: String,
    enum: {
      values: ['immediate', 'net_15', 'net_30', 'net_45', 'net_60', 'net_90', 'custom'],
      message: 'Invalid payment terms'
    },
    default: 'net_30'
  },
  customPaymentTerms: {
    type: String,
    trim: true,
    required: function() {
      return this.paymentTerms === 'custom';
    }
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: function(value) {
        return !value || (value >= 1 && value <= 5);
      },
      message: 'Rating must be between 1 and 5'
    }
  },
  categories: [{
    type: String,
    enum: [
      'pharmaceuticals', 'medical_devices', 'supplements', 'cosmetics', 
      'laboratory_supplies', 'packaging', 'equipment', 'software', 'services', 'other'
    ],
    validate: {
      validator: function(categories) {
        return categories && categories.length > 0;
      },
      message: 'At least one category must be selected'
    }
  }],
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    number: {
      type: String,
      trim: true
    },
    issuedBy: {
      type: String,
      trim: true
    },
    issueDate: {
      type: Date
    },
    expiryDate: {
      type: Date,
      validate: {
        validator: function(date) {
          return !date || !this.issueDate || date > this.issueDate;
        },
        message: 'Expiry date must be after issue date'
      }
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'suspended'],
      default: 'active'
    }
  }],
  taxInformation: {
    taxId: {
      type: String,
      trim: true,
      maxlength: [50, 'Tax ID cannot exceed 50 characters']
    },
    vatNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'VAT number cannot exceed 50 characters']
    },
    taxExempt: {
      type: Boolean,
      default: false
    }
  },
  preferredOrderMethod: {
    type: String,
    enum: ['email', 'phone', 'fax', 'online_portal', 'in_person'],
    default: 'email'
  },
  deliveryInformation: {
    leadTime: {
      type: Number,
      min: [0, 'Lead time cannot be negative'],
      default: 7 // days
    },
    minimumOrderAmount: {
      type: Number,
      min: [0, 'Minimum order amount cannot be negative'],
      default: 0
    },
    deliveryFee: {
      type: Number,
      min: [0, 'Delivery fee cannot be negative'],
      default: 0
    },
    freeDeliveryThreshold: {
      type: Number,
      min: [0, 'Free delivery threshold cannot be negative'],
      default: 0
    },
    deliveryDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  documents: [{
    type: {
      type: String,
      enum: ['contract', 'license', 'certificate', 'tax_document', 'insurance', 'other'],
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isBlacklisted: {
    type: Boolean,
    default: false
  },
  blacklistReason: {
    type: String,
    trim: true,
    required: function() {
      return this.isBlacklisted;
    }
  },
  lastOrderDate: {
    type: Date
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: [0, 'Total orders cannot be negative']
  },
  totalOrderValue: {
    type: Number,
    default: 0,
    min: [0, 'Total order value cannot be negative']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for available credit
supplierSchema.virtual('availableCredit').get(function() {
  return this.creditLimit - this.currentCredit;
});

// Virtual for credit utilization percentage
supplierSchema.virtual('creditUtilization').get(function() {
  if (this.creditLimit === 0) return 0;
  return ((this.currentCredit / this.creditLimit) * 100).toFixed(2);
});

// Virtual for average order value
supplierSchema.virtual('averageOrderValue').get(function() {
  if (this.totalOrders === 0) return 0;
  return (this.totalOrderValue / this.totalOrders).toFixed(2);
});

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function() {
  const { street, city, state, zipCode, country } = this.address;
  return `${street}, ${city}, ${state} ${zipCode}, ${country}`.trim();
});

// Indexes for performance
supplierSchema.index({ name: 1 });
supplierSchema.index({ email: 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ categories: 1 });
supplierSchema.index({ rating: -1 });
supplierSchema.index({ lastOrderDate: -1 });

// Text index for search functionality
supplierSchema.index({
  name: 'text',
  contactPerson: 'text',
  'address.city': 'text',
  'address.state': 'text'
});

// Pre-save middleware
supplierSchema.pre('save', function(next) {
  // Ensure current credit doesn't exceed credit limit
  if (this.currentCredit > this.creditLimit) {
    this.currentCredit = this.creditLimit;
  }
  
  next();
});

// Static method to find suppliers with available credit
supplierSchema.statics.findWithAvailableCredit = function() {
  return this.find({
    isActive: true,
    $expr: { $gt: ['$creditLimit', '$currentCredit'] }
  });
};

// Static method to find suppliers by category
supplierSchema.statics.findByCategory = function(category) {
  return this.find({
    isActive: true,
    categories: category
  });
};

// Static method to find overdue suppliers (assuming payment terms)
supplierSchema.statics.findOverdue = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.find({
    isActive: true,
    currentCredit: { $gt: 0 },
    lastOrderDate: { $lt: thirtyDaysAgo }
  });
};

// Instance method to update order statistics
supplierSchema.methods.updateOrderStats = function(orderValue) {
  this.totalOrders += 1;
  this.totalOrderValue += orderValue;
  this.lastOrderDate = new Date();
  return this.save();
};

// Instance method to adjust credit
supplierSchema.methods.adjustCredit = function(amount, type = 'add') {
  if (type === 'add') {
    this.currentCredit += amount;
  } else if (type === 'subtract') {
    this.currentCredit -= amount;
  }
  
  // Ensure credit doesn't go below 0 or exceed limit
  this.currentCredit = Math.max(0, Math.min(this.currentCredit, this.creditLimit));
  
  return this.save();
};

// Instance method to check if can place order
supplierSchema.methods.canPlaceOrder = function(orderValue) {
  if (!this.isActive || this.isBlacklisted) return false;
  return (this.currentCredit + orderValue) <= this.creditLimit;
};

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;