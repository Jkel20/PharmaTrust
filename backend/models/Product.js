const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  genericName: {
    type: String,
    trim: true,
    maxlength: [100, 'Generic name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: [
        'antibiotics',
        'painkillers',
        'vitamins',
        'supplements',
        'first_aid',
        'personal_care',
        'medical_devices',
        'prescription_drugs',
        'otc_medications',
        'other'
      ],
      message: 'Please select a valid category'
    }
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: {
      values: ['tablets', 'capsules', 'bottles', 'tubes', 'boxes', 'pieces', 'grams', 'milliliters'],
      message: 'Please select a valid unit'
    }
  },
  reorderLevel: {
    type: Number,
    required: [true, 'Reorder level is required'],
    min: [0, 'Reorder level cannot be negative'],
    default: 10
  },
  reorderQuantity: {
    type: Number,
    required: [true, 'Reorder quantity is required'],
    min: [1, 'Reorder quantity must be at least 1'],
    default: 50
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true
  },
  isPrescriptionRequired: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  storageLocation: {
    type: String,
    trim: true,
    default: 'Main Storage'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice > 0) {
    return ((this.price - this.costPrice) / this.costPrice * 100).toFixed(2);
  }
  return 0;
});

// Virtual for total value
productSchema.virtual('totalValue').get(function() {
  return this.price * this.quantity;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.reorderLevel) return 'low_stock';
  return 'in_stock';
});

// Virtual for expiry status
productSchema.virtual('expiryStatus').get(function() {
  const today = new Date();
  const expiryDate = new Date(this.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring_soon';
  return 'valid';
});

// Virtual for days until expiry
productSchema.virtual('daysUntilExpiry').get(function() {
  const today = new Date();
  const expiryDate = new Date(this.expiryDate);
  return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
productSchema.index({ name: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ expiryDate: 1 });
productSchema.index({ quantity: 1 });

// Pre-save middleware to validate expiry date
productSchema.pre('save', function(next) {
  if (this.expiryDate && new Date(this.expiryDate) <= new Date()) {
    return next(new Error('Expiry date cannot be in the past'));
  }
  next();
});

// Static method to find low stock products
productSchema.statics.findLowStock = function() {
  return this.find({
    $expr: {
      $lte: ['$quantity', '$reorderLevel']
    },
    isActive: true
  });
};

// Static method to find expiring products
productSchema.statics.findExpiringSoon = function(days = 30) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  
  return this.find({
    expiryDate: {
      $lte: targetDate,
      $gte: new Date()
    },
    isActive: true
  });
};

// Static method to find expired products
productSchema.statics.findExpired = function() {
  return this.find({
    expiryDate: { $lt: new Date() },
    isActive: true
  });
};

// Instance method to check if product needs reorder
productSchema.methods.needsReorder = function() {
  return this.quantity <= this.reorderLevel;
};

// Instance method to check if product is expired
productSchema.methods.isExpired = function() {
  return new Date(this.expiryDate) < new Date();
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'add') {
  if (operation === 'add') {
    this.quantity += quantity;
  } else if (operation === 'subtract') {
    if (this.quantity < quantity) {
      throw new Error('Insufficient stock');
    }
    this.quantity -= quantity;
  }
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
