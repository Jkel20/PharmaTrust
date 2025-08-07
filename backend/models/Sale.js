const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       required:
 *         - saleNumber
 *         - items
 *         - subtotal
 *         - totalAmount
 *         - soldBy
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated sale ID
 *         saleNumber:
 *           type: string
 *           description: Unique sale/receipt number
 *         items:
 *           type: array
 *           description: List of sold items
 *         customer:
 *           type: object
 *           description: Customer information (optional)
 *         prescription:
 *           type: string
 *           description: Associated prescription ID (if applicable)
 *         subtotal:
 *           type: number
 *           description: Subtotal before discounts and taxes
 *         discountAmount:
 *           type: number
 *           description: Total discount applied
 *         taxAmount:
 *           type: number
 *           description: Total tax amount
 *         totalAmount:
 *           type: number
 *           description: Final total amount
 *         paymentMethod:
 *           type: string
 *           enum: [cash, card, mobile_money, bank_transfer, credit, insurance]
 *           description: Payment method used
 *         saleType:
 *           type: string
 *           enum: [prescription, over_counter, wholesale]
 *           description: Type of sale
 *         status:
 *           type: string
 *           enum: [completed, pending, cancelled, refunded, partially_refunded]
 *           description: Sale status
 */

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    required: [true, 'Sale number is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Sale number cannot exceed 50 characters'],
    index: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required']
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    genericName: {
      type: String,
      trim: true
    },
    batchNumber: {
      type: String,
      trim: true
    },
    expiryDate: {
      type: Date
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number'
      }
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
      },
      value: {
        type: Number,
        min: [0, 'Discount value cannot be negative'],
        default: 0
      }
    },
    discountAmount: {
      type: Number,
      min: [0, 'Discount amount cannot be negative'],
      default: 0
    },
    taxRate: {
      type: Number,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100'],
      default: 0
    },
    taxAmount: {
      type: Number,
      min: [0, 'Tax amount cannot be negative'],
      default: 0
    },
    lineTotal: {
      type: Number,
      required: [true, 'Line total is required'],
      min: [0, 'Line total cannot be negative']
    },
    isPrescriptionItem: {
      type: Boolean,
      default: false
    },
    prescriptionItemIndex: {
      type: Number,
      min: [0, 'Prescription item index cannot be negative']
    }
  }],
  customer: {
    type: {
      type: String,
      enum: ['walk_in', 'registered'],
      default: 'walk_in'
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: function(phone) {
          return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
        },
        message: 'Please provide a valid phone number'
      }
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(email) {
          return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please provide a valid email address'
      }
    },
    nationalId: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(date) {
          return !date || date <= new Date();
        },
        message: 'Date of birth cannot be in the future'
      }
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
      }
    }
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    index: true
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  discountAmount: {
    type: Number,
    min: [0, 'Discount amount cannot be negative'],
    default: 0
  },
  taxAmount: {
    type: Number,
    min: [0, 'Tax amount cannot be negative'],
    default: 0
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  payment: {
    method: {
      type: String,
      enum: {
        values: ['cash', 'card', 'mobile_money', 'bank_transfer', 'credit', 'insurance', 'multiple'],
        message: 'Invalid payment method'
      },
      required: [true, 'Payment method is required'],
      default: 'cash'
    },
    amountPaid: {
      type: Number,
      required: [true, 'Amount paid is required'],
      min: [0, 'Amount paid cannot be negative']
    },
    changeGiven: {
      type: Number,
      min: [0, 'Change given cannot be negative'],
      default: 0
    },
    reference: {
      type: String,
      trim: true
    },
    multiplePayments: [{
      method: {
        type: String,
        enum: ['cash', 'card', 'mobile_money', 'bank_transfer', 'credit', 'insurance'],
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Payment amount cannot be negative']
      },
      reference: {
        type: String,
        trim: true
      }
    }],
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
      default: 'completed'
    }
  },
  insurance: {
    provider: {
      type: String,
      trim: true
    },
    policyNumber: {
      type: String,
      trim: true
    },
    claimNumber: {
      type: String,
      trim: true
    },
    copayAmount: {
      type: Number,
      min: [0, 'Copay amount cannot be negative'],
      default: 0
    },
    coverageAmount: {
      type: Number,
      min: [0, 'Coverage amount cannot be negative'],
      default: 0
    },
    deductibleAmount: {
      type: Number,
      min: [0, 'Deductible amount cannot be negative'],
      default: 0
    }
  },
  saleType: {
    type: String,
    enum: {
      values: ['prescription', 'over_counter', 'wholesale', 'emergency'],
      message: 'Invalid sale type'
    },
    required: [true, 'Sale type is required'],
    default: 'over_counter',
    index: true
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'cancelled', 'refunded', 'partially_refunded', 'on_hold'],
      message: 'Invalid sale status'
    },
    default: 'completed',
    index: true
  },
  refunds: [{
    refundNumber: {
      type: String,
      required: true,
      trim: true
    },
    items: [{
      itemIndex: {
        type: Number,
        required: true
      },
      quantityRefunded: {
        type: Number,
        required: true,
        min: [1, 'Quantity refunded must be at least 1']
      },
      refundAmount: {
        type: Number,
        required: true,
        min: [0, 'Refund amount cannot be negative']
      },
      reason: {
        type: String,
        trim: true
      }
    }],
    totalRefundAmount: {
      type: Number,
      required: true,
      min: [0, 'Total refund amount cannot be negative']
    },
    refundDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    refundMethod: {
      type: String,
      enum: ['cash', 'card', 'mobile_money', 'bank_transfer', 'credit'],
      required: true
    }
  }],
  receiptPrinted: {
    type: Boolean,
    default: false
  },
  receiptPrintCount: {
    type: Number,
    default: 0,
    min: [0, 'Receipt print count cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  qrCode: {
    type: String,
    trim: true
  },
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sold by user is required'],
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night'],
    default: 'morning'
  },
  location: {
    counter: {
      type: String,
      trim: true
    },
    terminal: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for customer full name
saleSchema.virtual('customer.fullName').get(function() {
  if (this.customer.firstName && this.customer.lastName) {
    return `${this.customer.firstName} ${this.customer.lastName}`;
  }
  return 'Walk-in Customer';
});

// Virtual for total items count
saleSchema.virtual('totalItems').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for total profit
saleSchema.virtual('totalProfit').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  // This would require unit cost from product model to calculate accurately
  return this.totalAmount * 0.3; // Assuming 30% profit margin for demo
});

// Virtual for total refunded amount
saleSchema.virtual('totalRefunded').get(function() {
  if (!this.refunds || this.refunds.length === 0) return 0;
  return this.refunds.reduce((total, refund) => total + refund.totalRefundAmount, 0);
});

// Virtual for net amount (after refunds)
saleSchema.virtual('netAmount').get(function() {
  return this.totalAmount - this.totalRefunded;
});

// Virtual for is prescription sale
saleSchema.virtual('isPrescriptionSale').get(function() {
  return this.saleType === 'prescription' || !!this.prescription;
});

// Indexes for performance
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ soldBy: 1, createdAt: -1 });
saleSchema.index({ saleType: 1, status: 1 });
saleSchema.index({ prescription: 1 });
saleSchema.index({ 'customer.phoneNumber': 1 });
saleSchema.index({ 'payment.method': 1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ totalAmount: -1 });

// Text index for search functionality
saleSchema.index({
  saleNumber: 'text',
  'customer.firstName': 'text',
  'customer.lastName': 'text',
  'customer.phoneNumber': 'text',
  'items.productName': 'text'
});

// Pre-save middleware
saleSchema.pre('save', function(next) {
  // Auto-generate sale number if not provided
  if (!this.saleNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    this.saleNumber = `SAL${timestamp.slice(-8)}${random}`;
  }
  
  // Calculate totals
  if (this.items && this.items.length > 0) {
    // Calculate line totals for each item
    this.items.forEach(item => {
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = item.discount.type === 'percentage' 
        ? (subtotal * item.discount.value / 100)
        : Math.min(item.discount.value, subtotal);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (item.taxRate / 100);
      
      item.discountAmount = discountAmount;
      item.taxAmount = taxAmount;
      item.lineTotal = taxableAmount + taxAmount;
    });
    
    // Calculate totals
    this.subtotal = this.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
    this.discountAmount = this.items.reduce((total, item) => total + item.discountAmount, 0);
    this.taxAmount = this.items.reduce((total, item) => total + item.taxAmount, 0);
    this.totalAmount = this.items.reduce((total, item) => total + item.lineTotal, 0);
  }
  
  // Calculate change if cash payment
  if (this.payment.method === 'cash' && this.payment.amountPaid > this.totalAmount) {
    this.payment.changeGiven = this.payment.amountPaid - this.totalAmount;
  }
  
  next();
});

// Static method to find sales by date range
saleSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    status: { $nin: ['cancelled'] }
  }).sort({ createdAt: -1 });
};

// Static method to find sales by user
saleSchema.statics.findByUser = function(userId, startDate, endDate) {
  const query = { soldBy: userId, status: { $nin: ['cancelled'] } };
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method for sales analytics
saleSchema.statics.getSalesAnalytics = function(startDate, endDate) {
  const matchStage = {
    status: { $nin: ['cancelled'] }
  };
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        totalItems: { $sum: { $size: '$items' } },
        averageSaleAmount: { $avg: '$totalAmount' },
        totalRefunds: { $sum: { $size: '$refunds' } }
      }
    }
  ]);
};

// Static method for top selling products
saleSchema.statics.getTopSellingProducts = function(limit = 10, startDate, endDate) {
  const matchStage = {
    status: { $nin: ['cancelled'] }
  };
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$items.productName' },
        totalQuantitySold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.lineTotal' },
        salesCount: { $sum: 1 }
      }
    },
    { $sort: { totalQuantitySold: -1 } },
    { $limit: limit }
  ]);
};

// Instance method to add refund
saleSchema.methods.addRefund = function(refundData, refundedBy) {
  const refundNumber = `REF${Date.now().toString().slice(-8)}`;
  
  const refund = {
    refundNumber,
    items: refundData.items,
    totalRefundAmount: refundData.totalRefundAmount,
    refundedBy,
    reason: refundData.reason,
    refundMethod: refundData.refundMethod || this.payment.method
  };
  
  this.refunds.push(refund);
  
  // Update status
  const totalRefunded = this.refunds.reduce((sum, r) => sum + r.totalRefundAmount, 0);
  if (totalRefunded >= this.totalAmount) {
    this.status = 'refunded';
  } else if (totalRefunded > 0) {
    this.status = 'partially_refunded';
  }
  
  return this.save();
};

// Instance method to generate QR code data
saleSchema.methods.generateQRData = function() {
  return {
    saleNumber: this.saleNumber,
    totalAmount: this.totalAmount,
    date: this.createdAt,
    items: this.items.length
  };
};

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
