const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    default: null
  }
}, {
  timestamps: true
});

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    required: [true, 'Sale number is required'],
    unique: true,
    trim: true
  },
  customer: {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['cash', 'card', 'mobile_money', 'bank_transfer'],
      message: 'Please select a valid payment method'
    }
  },
  paymentStatus: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: {
      values: ['pending', 'paid', 'partially_paid', 'refunded'],
      message: 'Please select a valid payment status'
    },
    default: 'paid'
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Cashier is required']
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  isVoid: {
    type: Boolean,
    default: false
  },
  voidReason: {
    type: String,
    trim: true
  },
  voidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  voidedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profit calculation
saleSchema.virtual('profit').get(function() {
  let totalProfit = 0;
  this.items.forEach(item => {
    // This would need to be calculated based on product cost price
    // For now, we'll use a simple calculation
    const profitPerItem = (item.unitPrice - (item.unitPrice * 0.7)) * item.quantity; // Assuming 30% profit margin
    totalProfit += profitPerItem;
  });
  return totalProfit;
});

// Virtual for items count
saleSchema.virtual('itemsCount').get(function() {
  return this.items.length;
});

// Virtual for total quantity
saleSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Indexes for better query performance
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ 'customer.name': 1 });
saleSchema.index({ cashier: 1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ paymentStatus: 1 });
saleSchema.index({ isVoid: 1 });

// Pre-save middleware to generate sale number
saleSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Get count of sales for today
    const todaySales = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      }
    });
    
    this.saleNumber = `SALE-${year}${month}${day}-${String(todaySales + 1).padStart(3, '0')}`;
    this.receiptNumber = `REC-${year}${month}${day}-${String(todaySales + 1).padStart(3, '0')}`;
  }
  next();
});

// Static method to get sales by date range
saleSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    },
    isVoid: false
  }).populate('cashier', 'firstName lastName');
};

// Static method to get sales by cashier
saleSchema.statics.findByCashier = function(cashierId, startDate, endDate) {
  const query = { cashier: cashierId, isVoid: false };
  
  if (startDate && endDate) {
    query.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).populate('cashier', 'firstName lastName');
};

// Static method to get daily sales summary
saleSchema.statics.getDailySummary = function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        isVoid: false
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        totalItems: { $sum: { $sum: '$items.quantity' } },
        salesCount: { $sum: 1 },
        averageSale: { $avg: '$total' }
      }
    }
  ]);
};

// Instance method to void sale
saleSchema.methods.voidSale = function(reason, voidedBy) {
  this.isVoid = true;
  this.voidReason = reason;
  this.voidedBy = voidedBy;
  this.voidedAt = new Date();
  return this.save();
};

// Instance method to calculate totals
saleSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((total, item) => total + item.totalPrice, 0);
  this.total = this.subtotal + this.tax - this.discount;
  return this;
};

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
