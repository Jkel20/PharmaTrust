const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Prescription:
 *       type: object
 *       required:
 *         - patientName
 *         - doctorName
 *         - medications
 *         - prescriptionDate
 *       properties:
 *         prescriptionNumber:
 *           type: string
 *           description: Unique prescription number
 *         patientName:
 *           type: string
 *           description: Patient's full name
 *         patientPhone:
 *           type: string
 *           description: Patient's phone number
 *         doctorName:
 *           type: string
 *           description: Doctor's name
 *         doctorPhone:
 *           type: string
 *           description: Doctor's phone number
 *         medications:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               dosage:
 *                 type: string
 *               frequency:
 *                 type: string
 *               duration:
 *                 type: string
 *               quantity:
 *                 type: number
 *         prescriptionDate:
 *           type: string
 *           format: date
 *           description: Date prescription was written
 *         status:
 *           type: string
 *           enum: [pending, dispensed, cancelled]
 *           description: Prescription status
 *         dispensedBy:
 *           type: string
 *           description: User ID who dispensed the prescription
 *         dispensedAt:
 *           type: string
 *           format: date-time
 *           description: When prescription was dispensed
 */

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true,
    minlength: [2, 'Medication name must be at least 2 characters long'],
    maxlength: [100, 'Medication name cannot exceed 100 characters']
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true,
    minlength: [1, 'Dosage must be at least 1 character long'],
    maxlength: [50, 'Dosage cannot exceed 50 characters']
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    trim: true,
    maxlength: [50, 'Frequency cannot exceed 50 characters']
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true,
    maxlength: [50, 'Duration cannot exceed 50 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  }
}, { _id: true });

const prescriptionSchema = new mongoose.Schema({
  prescriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    minlength: [2, 'Patient name must be at least 2 characters long'],
    maxlength: [100, 'Patient name cannot exceed 100 characters']
  },
  patientPhone: {
    type: String,
    trim: true,
    match: [/^(\+233|0)[0-9]{9}$/, 'Please enter a valid Ghanaian phone number']
  },
  patientAge: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age cannot exceed 150']
  },
  doctorName: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
    minlength: [2, 'Doctor name must be at least 2 characters long'],
    maxlength: [100, 'Doctor name cannot exceed 100 characters']
  },
  doctorPhone: {
    type: String,
    trim: true,
    match: [/^(\+233|0)[0-9]{9}$/, 'Please enter a valid Ghanaian phone number']
  },
  doctorLicense: {
    type: String,
    trim: true,
    maxlength: [50, 'Doctor license cannot exceed 50 characters']
  },
  medications: {
    type: [medicationSchema],
    required: [true, 'At least one medication is required'],
    validate: {
      validator: function(medications) {
        return medications && medications.length > 0;
      },
      message: 'At least one medication is required'
    }
  },
  prescriptionDate: {
    type: Date,
    required: [true, 'Prescription date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'dispensed', 'cancelled'],
      message: 'Status must be pending, dispensed, or cancelled'
    },
    default: 'pending'
  },
  dispensedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dispensedAt: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for prescription age in days
prescriptionSchema.virtual('ageInDays').get(function() {
  const today = new Date();
  const prescriptionDate = new Date(this.prescriptionDate);
  return Math.ceil((today - prescriptionDate) / (1000 * 60 * 60 * 24));
});

// Virtual for total medications
prescriptionSchema.virtual('totalMedications').get(function() {
  return this.medications ? this.medications.length : 0;
});

// Virtual for is expired (prescriptions older than 30 days)
prescriptionSchema.virtual('isExpired').get(function() {
  return this.ageInDays > 30;
});

// Indexes for better query performance
prescriptionSchema.index({ prescriptionNumber: 1 });
prescriptionSchema.index({ patientName: 1 });
prescriptionSchema.index({ doctorName: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ prescriptionDate: 1 });
prescriptionSchema.index({ dispensedBy: 1 });

// Pre-save middleware to generate prescription number
prescriptionSchema.pre('save', function(next) {
  if (this.isNew && !this.prescriptionNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.prescriptionNumber = `PRES-${timestamp}-${random}`;
  }
  next();
});

// Pre-save middleware to update dispensedAt when status changes to dispensed
prescriptionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'dispensed' && !this.dispensedAt) {
    this.dispensedAt = new Date();
  }
  next();
});

// Static method to find pending prescriptions
prescriptionSchema.statics.findPending = function() {
  return this.find({ status: 'pending' });
};

// Static method to find expired prescriptions
prescriptionSchema.statics.findExpired = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.find({
    prescriptionDate: { $lte: thirtyDaysAgo },
    status: 'pending'
  });
};

// Static method to find prescriptions by patient
prescriptionSchema.statics.findByPatient = function(patientName) {
  return this.find({
    patientName: { $regex: patientName, $options: 'i' }
  }).sort({ prescriptionDate: -1 });
};

// Instance method to dispense prescription
prescriptionSchema.methods.dispense = function(userId, totalAmount = 0) {
  this.status = 'dispensed';
  this.dispensedBy = userId;
  this.dispensedAt = new Date();
  this.totalAmount = totalAmount;
  return this.save();
};

// Instance method to cancel prescription
prescriptionSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;