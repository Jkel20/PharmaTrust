const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       required:
 *         - products
 *         - totalAmount
 *         - soldBy
 *       properties:
 *         receiptNumber:
 *           type: string
 *           description: Unique receipt number
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product ID
 *               quantity:
 *                 type: number
 *                 description: Quantity sold
 *               price:
 *                 type: number
 *                 description: Price per unit
 *               total:
 *                 type: number
 *                 description: Total for this product
 *         customerName:
 *           type: string
 *           description: Customer name
 *         customerPhone:
 *           type: string
 *           description: Customer phone number
 *         totalAmount:
 *           type: number
 *           description: Total sale amount
 *         discount:
 *           type: number
 *           description: Discount amount
 *         finalAmount:
 *           type: number
 *           description: Final amount after discount
 *         paymentMethod:
 *           type: string
 *           enum: [cash, card, mobile_money]
 *           description: Payment method used
 *         soldBy:
 *           type: string
 *           description: User ID who made the sale
 *         prescription:
 *           type: string
 *           description: Prescription ID if applicable
 *         status:
 *           type: string
 *           enum: [completed, cancelled, refunded]
 *           description: Sale status
 */

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
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  }
}, { _id: true });

const saleSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    unique: true,
    required: true
  },
  products: {
    type: [saleItemSchema],
    required: [true, 'At least one product is required'],
    validate: {
      validator: function(products) {
        return products && products.length > 0;
      },
      message: 'At least one product is required'
    }
  },
  customerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  customerPhone: {
    type: String,
    trim: true,
    match: [/^(\+233|0)[0-9]{9}$/, 'Please enter a valid Ghanaian phone number']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  finalAmount: {
    type: Number,
    required: [true, 'Final amount is required'],
    min: [0, 'Final amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'card', 'mobile_money'],
      message: 'Payment method must be cash, card, or mobile_money'
    },
    required: [true, 'Payment method is required']
  },
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  status: {
    type: String,
    enum: {
      values: ['completed', 'cancelled', 'refunded'],
      message: 'Status must be completed, cancelled, or refunded'
    },
    default: 'completed'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items sold
saleSchema.virtual('totalItems').get(function() {
  return this.products ? this.products.reduce((total, item) => total + item.quantity, 0) : 0;
});

// Virtual for discount percentage
saleSchema.virtual('discountPercentage').get(function() {
  if (this.totalAmount === 0) return 0;
  return Math.round((this.discount / this.totalAmount) * 100);
});

// Virtual for is prescription sale
saleSchema.virtual('isPrescriptionSale').get(function() {
  return !!this.prescription;
});

// Indexes for better query performance
saleSchema.index({ receiptNumber: 1 });
saleSchema.index({ soldBy: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ createdAt: 1 });
saleSchema.index({ customerName: 1 });
saleSchema.index({ prescription: 1 });

// Pre-save middleware to generate receipt number
saleSchema.pre('save', function(next) {
  if (this.isNew && !this.receiptNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.receiptNumber = `RCP-${timestamp}-${random}`;
  }
  next();
});

// Pre-save middleware to calculate totals
saleSchema.pre('save', function(next) {
  if (this.products && this.products.length > 0) {
    // Calculate total for each product
    this.products.forEach(item => {
      item.total = item.price * item.quantity;
    });
    
    // Calculate total amount
    this.totalAmount = this.products.reduce((total, item) => total + item.total, 0);
    
    // Calculate final amount
    this.finalAmount = this.totalAmount - this.discount;
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
    status: 'completed'
  });
};

// Static method to find sales by seller
saleSchema.statics.findBySeller = function(sellerId) {
  return this.find({ soldBy: sellerId, status: 'completed' });
};

// Static method to find prescription sales
saleSchema.statics.findPrescriptionSales = function() {
  return this.find({ prescription: { $exists: true, $ne: null } });
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
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$finalAmount' },
        totalTransactions: { $sum: 1 },
        totalItems: { $sum: '$totalItems' }
      }
    }
  ]);
};

// Instance method to cancel sale
saleSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Instance method to refund sale
saleSchema.methods.refund = function() {
  this.status = 'refunded';
  return this.save();
};

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
