const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Supplier:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Supplier name
 *         email:
 *           type: string
 *           format: email
 *           description: Supplier email address
 *         phone:
 *           type: string
 *           description: Supplier phone number
 *         address:
 *           type: string
 *           description: Supplier address
 *         contactPerson:
 *           type: string
 *           description: Primary contact person
 *         creditLimit:
 *           type: number
 *           description: Credit limit for the supplier
 *         currentCredit:
 *           type: number
 *           description: Current credit amount
 *         paymentTerms:
 *           type: string
 *           description: Payment terms
 *         isActive:
 *           type: boolean
 *           description: Whether the supplier is active
 */

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    minlength: [2, 'Supplier name must be at least 2 characters long'],
    maxlength: [100, 'Supplier name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^(\+233|0)[0-9]{9}$/, 'Please enter a valid Ghanaian phone number']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  contactPerson: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters']
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative']
  },
  currentCredit: {
    type: Number,
    default: 0,
    min: [0, 'Current credit cannot be negative']
  },
  paymentTerms: {
    type: String,
    enum: ['immediate', '7_days', '15_days', '30_days', '60_days'],
    default: '30_days'
  },
  isActive: {
    type: Boolean,
    default: true
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

// Virtual for available credit
supplierSchema.virtual('availableCredit').get(function() {
  return Math.max(0, this.creditLimit - this.currentCredit);
});

// Virtual for credit utilization percentage
supplierSchema.virtual('creditUtilization').get(function() {
  if (this.creditLimit === 0) return 0;
  return Math.round((this.currentCredit / this.creditLimit) * 100);
});

// Virtual for credit status
supplierSchema.virtual('creditStatus').get(function() {
  if (this.currentCredit >= this.creditLimit) return 'limit_reached';
  if (this.currentCredit >= this.creditLimit * 0.8) return 'near_limit';
  return 'available';
});

// Indexes for better query performance
supplierSchema.index({ name: 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ email: 1 });

// Static method to find active suppliers
supplierSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find suppliers with credit issues
supplierSchema.statics.findWithCreditIssues = function() {
  return this.find({
    isActive: true,
    $expr: { $gte: ['$currentCredit', '$creditLimit'] }
  });
};

// Instance method to add credit
supplierSchema.methods.addCredit = function(amount) {
  this.currentCredit = Math.max(0, this.currentCredit + amount);
  return this.save();
};

// Instance method to reduce credit
supplierSchema.methods.reduceCredit = function(amount) {
  this.currentCredit = Math.max(0, this.currentCredit - amount);
  return this.save();
};

// Instance method to check if credit is available
supplierSchema.methods.hasCreditAvailable = function(amount = 0) {
  return this.isActive && (this.currentCredit + amount) <= this.creditLimit;
};

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;