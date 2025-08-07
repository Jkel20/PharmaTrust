const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - genericName
 *         - category
 *         - manufacturer
 *         - batchNumber
 *         - quantity
 *         - unitPrice
 *         - sellingPrice
 *         - expiryDate
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated product ID
 *         name:
 *           type: string
 *           description: Product brand name
 *         genericName:
 *           type: string
 *           description: Generic/scientific name
 *         category:
 *           type: string
 *           enum: [tablet, capsule, syrup, injection, cream, ointment, drops, inhaler, other]
 *           description: Product category
 *         manufacturer:
 *           type: string
 *           description: Manufacturer name
 *         supplier:
 *           type: string
 *           description: Supplier ID reference
 *         batchNumber:
 *           type: string
 *           description: Batch/lot number
 *         quantity:
 *           type: number
 *           description: Current stock quantity
 *         unitOfMeasurement:
 *           type: string
 *           description: Unit of measurement (pieces, bottles, etc.)
 *         unitPrice:
 *           type: number
 *           description: Cost price per unit
 *         sellingPrice:
 *           type: number
 *           description: Selling price per unit
 *         wholesalePrice:
 *           type: number
 *           description: Wholesale price per unit
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: Product expiry date
 *         manufacturingDate:
 *           type: string
 *           format: date
 *           description: Manufacturing date
 *         reorderLevel:
 *           type: number
 *           description: Minimum stock level before reorder
 *         maxStockLevel:
 *           type: number
 *           description: Maximum stock level
 *         location:
 *           type: object
 *           description: Storage location in pharmacy
 *         isActive:
 *           type: boolean
 *           description: Whether product is active
 *         requiresPrescription:
 *           type: boolean
 *           description: Whether product requires prescription
 */

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    index: true
  },
  genericName: {
    type: String,
    required: [true, 'Generic name is required'],
    trim: true,
    maxlength: [100, 'Generic name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: [
        'tablet', 'capsule', 'syrup', 'injection', 'cream', 
        'ointment', 'drops', 'inhaler', 'suppository', 'patch', 
        'powder', 'suspension', 'solution', 'gel', 'spray', 'other'
      ],
      message: 'Invalid product category'
    },
    index: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true,
    maxlength: [100, 'Manufacturer name cannot exceed 100 characters']
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true,
    maxlength: [50, 'Batch number cannot exceed 50 characters'],
    index: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number'
    }
  },
  unitOfMeasurement: {
    type: String,
    required: [true, 'Unit of measurement is required'],
    enum: {
      values: ['pieces', 'bottles', 'boxes', 'strips', 'vials', 'tubes', 'sachets', 'ml', 'mg', 'g', 'kg'],
      message: 'Invalid unit of measurement'
    },
    default: 'pieces'
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  wholesalePrice: {
    type: Number,
    min: [0, 'Wholesale price cannot be negative']
  },
  discountPercentage: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0
  },
  taxPercentage: {
    type: Number,
    min: [0, 'Tax cannot be negative'],
    max: [100, 'Tax cannot exceed 100%'],
    default: 0
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Expiry date must be in the future'
    },
    index: true
  },
  manufacturingDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date <= new Date();
      },
      message: 'Manufacturing date cannot be in the future'
    }
  },
  reorderLevel: {
    type: Number,
    required: [true, 'Reorder level is required'],
    min: [0, 'Reorder level cannot be negative'],
    default: 10
  },
  maxStockLevel: {
    type: Number,
    min: [0, 'Max stock level cannot be negative']
  },
  location: {
    aisle: {
      type: String,
      trim: true
    },
    shelf: {
      type: String,
      trim: true
    },
    bin: {
      type: String,
      trim: true
    },
    section: {
      type: String,
      trim: true
    }
  },
  storage: {
    temperature: {
      type: String,
      enum: ['room_temperature', 'refrigerated', 'frozen', 'controlled'],
      default: 'room_temperature'
    },
    humidity: {
      type: String,
      enum: ['normal', 'dry', 'controlled'],
      default: 'normal'
    },
    lightSensitive: {
      type: Boolean,
      default: false
    },
    specialInstructions: {
      type: String,
      trim: true
    }
  },
  dosageForm: {
    strength: {
      type: String,
      trim: true
    },
    unit: {
      type: String,
      trim: true
    },
    route: {
      type: String,
      enum: ['oral', 'topical', 'injection', 'inhalation', 'rectal', 'vaginal', 'nasal', 'ophthalmic', 'otic'],
      trim: true
    }
  },
  activeIngredients: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    concentration: {
      type: String,
      trim: true
    }
  }],
  contraindications: [{
    type: String,
    trim: true
  }],
  sideEffects: [{
    type: String,
    trim: true
  }],
  interactions: [{
    type: String,
    trim: true
  }],
  requiresPrescription: {
    type: Boolean,
    required: [true, 'Prescription requirement must be specified'],
    default: false
  },
  isControlledSubstance: {
    type: Boolean,
    default: false
  },
  controlledSubstanceSchedule: {
    type: String,
    enum: ['I', 'II', 'III', 'IV', 'V'],
    required: function() {
      return this.isControlledSubstance;
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isDiscontinued: {
    type: Boolean,
    default: false
  },
  images: [{
    url: {
      type: String,
      trim: true
    },
    alt: {
      type: String,
      trim: true
    }
  }],
  documents: [{
    type: {
      type: String,
      enum: ['datasheet', 'certificate', 'prescription', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  }],
  lastStockUpdate: {
    type: Date,
    default: Date.now
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

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.unitPrice && this.sellingPrice) {
    return ((this.sellingPrice - this.unitPrice) / this.unitPrice * 100).toFixed(2);
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.quantity <= 0) return 'out_of_stock';
  if (this.quantity <= this.reorderLevel) return 'low_stock';
  if (this.maxStockLevel && this.quantity >= this.maxStockLevel) return 'overstock';
  return 'in_stock';
});

// Virtual for expiry status
productSchema.virtual('expiryStatus').get(function() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  if (this.expiryDate <= now) return 'expired';
  if (this.expiryDate <= thirtyDaysFromNow) return 'expiring_soon';
  return 'fresh';
});

// Virtual for days until expiry
productSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diffTime = this.expiryDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total value
productSchema.virtual('totalValue').get(function() {
  return (this.quantity * this.sellingPrice).toFixed(2);
});

// Indexes for performance
productSchema.index({ name: 1, genericName: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ expiryDate: 1, isActive: 1 });
productSchema.index({ quantity: 1, reorderLevel: 1 });
productSchema.index({ batchNumber: 1, manufacturer: 1 });
productSchema.index({ 'location.aisle': 1, 'location.shelf': 1 });

// Text index for search functionality
productSchema.index({
  name: 'text',
  genericName: 'text',
  description: 'text',
  manufacturer: 'text'
});

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Update lastStockUpdate when quantity changes
  if (this.isModified('quantity')) {
    this.lastStockUpdate = new Date();
  }
  
  // Generate SKU if not provided
  if (!this.sku) {
    const categoryCode = this.category.substring(0, 3).toUpperCase();
    const nameCode = this.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    this.sku = `${categoryCode}${nameCode}${timestamp}`;
  }
  
  next();
});

// Static method to find low stock products
productSchema.statics.findLowStock = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $addFields: { isLowStock: { $lte: ['$quantity', '$reorderLevel'] } } },
    { $match: { isLowStock: true } },
    { $sort: { quantity: 1 } }
  ]);
};

// Static method to find expiring products
productSchema.statics.findExpiring = function(days = 30) {
  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() + days);
  
  return this.find({
    isActive: true,
    expiryDate: { $lte: expiryThreshold, $gte: new Date() }
  }).sort({ expiryDate: 1 });
};

// Static method to find expired products
productSchema.statics.findExpired = function() {
  return this.find({
    isActive: true,
    expiryDate: { $lt: new Date() }
  }).sort({ expiryDate: 1 });
};

// Static method for inventory valuation
productSchema.statics.getInventoryValue = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalCostValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
        totalSellingValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } },
        totalProducts: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);
};

// Instance method to adjust stock
productSchema.methods.adjustStock = function(adjustment, reason = 'manual') {
  this.quantity += adjustment;
  if (this.quantity < 0) this.quantity = 0;
  this.lastStockUpdate = new Date();
  return this.save();
};

// Instance method to check if reorder needed
productSchema.methods.needsReorder = function() {
  return this.quantity <= this.reorderLevel;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
