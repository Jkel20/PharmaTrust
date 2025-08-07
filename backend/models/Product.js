const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - stockQuantity
 *         - category
 *       properties:
 *         name:
 *           type: string
 *           description: Product name
 *         description:
 *           type: string
 *           description: Product description
 *         price:
 *           type: number
 *           description: Product price
 *         stockQuantity:
 *           type: integer
 *           description: Current stock quantity
 *         reorderLevel:
 *           type: integer
 *           description: Stock level at which to reorder
 *         category:
 *           type: string
 *           description: Product category
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: Product expiry date
 *         supplier:
 *           type: string
 *           description: Supplier ID
 *         barcode:
 *           type: string
 *           description: Product barcode
 *         isActive:
 *           type: boolean
 *           description: Whether the product is active
 */

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters long'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  reorderLevel: {
    type: Number,
    required: [true, 'Reorder level is required'],
    min: [0, 'Reorder level cannot be negative'],
    default: 10
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    minlength: [2, 'Category must be at least 2 characters long'],
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: null
  },
  unit: {
    type: String,
    enum: ['tablets', 'capsules', 'bottles', 'tubes', 'boxes', 'pieces'],
    default: 'pieces'
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stockQuantity <= 0) return 'out_of_stock';
  if (this.stockQuantity <= this.reorderLevel) return 'low_stock';
  return 'in_stock';
});

// Virtual for expiry status
productSchema.virtual('expiryStatus').get(function() {
  if (!this.expiryDate) return 'no_expiry';
  
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring_soon';
  return 'valid';
});

// Virtual for days until expiry
productSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ expiryDate: 1 });
productSchema.index({ stockQuantity: 1 });

// Pre-save middleware to validate expiry date
productSchema.pre('save', function(next) {
  if (this.expiryDate && this.expiryDate < new Date()) {
    const error = new Error('Expiry date cannot be in the past');
    return next(error);
  }
  next();
});

// Static method to find low stock products
productSchema.statics.findLowStock = function() {
  return this.find({
    $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
    isActive: true
  });
};

// Static method to find expiring products
productSchema.statics.findExpiring = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiryDate: { $lte: futureDate },
    isActive: true
  });
};

// Static method to find out of stock products
productSchema.statics.findOutOfStock = function() {
  return this.find({
    stockQuantity: 0,
    isActive: true
  });
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity) {
  this.stockQuantity = Math.max(0, this.stockQuantity + quantity);
  return this.save();
};

// Instance method to check if product can be sold
productSchema.methods.canBeSold = function(quantity = 1) {
  return this.isActive && this.stockQuantity >= quantity && this.expiryStatus !== 'expired';
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
