const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Prescription:
 *       type: object
 *       required:
 *         - prescriptionNumber
 *         - patient
 *         - doctor
 *         - medications
 *         - issueDate
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated prescription ID
 *         prescriptionNumber:
 *           type: string
 *           description: Unique prescription number
 *         patient:
 *           type: object
 *           description: Patient information
 *         doctor:
 *           type: object
 *           description: Doctor information
 *         medications:
 *           type: array
 *           description: List of prescribed medications
 *         issueDate:
 *           type: string
 *           format: date
 *           description: Date prescription was issued
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: Date prescription expires
 *         status:
 *           type: string
 *           enum: [pending, partially_filled, filled, expired, cancelled]
 *           description: Current prescription status
 *         totalAmount:
 *           type: number
 *           description: Total prescription value
 */

const prescriptionSchema = new mongoose.Schema({
  prescriptionNumber: {
    type: String,
    required: [true, 'Prescription number is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Prescription number cannot exceed 50 characters'],
    index: true
  },
  patient: {
    firstName: {
      type: String,
      required: [true, 'Patient first name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Patient last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Patient date of birth is required'],
      validate: {
        validator: function(date) {
          return date <= new Date();
        },
        message: 'Date of birth cannot be in the future'
      }
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'other'],
        message: 'Gender must be male, female, or other'
      },
      required: [true, 'Patient gender is required']
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
    },
    nationalId: {
      type: String,
      trim: true,
      maxlength: [50, 'National ID cannot exceed 50 characters']
    },
    insuranceNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Insurance number cannot exceed 50 characters']
    },
    allergies: [{
      allergen: {
        type: String,
        required: true,
        trim: true
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'moderate'
      },
      reaction: {
        type: String,
        trim: true
      }
    }],
    medicalConditions: [{
      condition: {
        type: String,
        required: true,
        trim: true
      },
      diagnosisDate: {
        type: Date
      },
      status: {
        type: String,
        enum: ['active', 'resolved', 'chronic'],
        default: 'active'
      }
    }]
  },
  doctor: {
    firstName: {
      type: String,
      required: [true, 'Doctor first name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Doctor last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    licenseNumber: {
      type: String,
      required: [true, 'Doctor license number is required'],
      trim: true,
      maxlength: [50, 'License number cannot exceed 50 characters'],
      index: true
    },
    specialty: {
      type: String,
      trim: true,
      maxlength: [100, 'Specialty cannot exceed 100 characters']
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
    hospital: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, 'Hospital name cannot exceed 100 characters']
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
      },
      phoneNumber: {
        type: String,
        validate: {
          validator: function(phone) {
            return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
          },
          message: 'Please provide a valid phone number'
        }
      }
    }
  },
  medications: [{
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
    dosage: {
      strength: {
        type: String,
        required: [true, 'Dosage strength is required'],
        trim: true
      },
      unit: {
        type: String,
        required: [true, 'Dosage unit is required'],
        trim: true
      }
    },
    instructions: {
      frequency: {
        type: String,
        required: [true, 'Frequency is required'],
        trim: true
      },
      duration: {
        value: {
          type: Number,
          required: [true, 'Duration value is required'],
          min: [1, 'Duration must be at least 1']
        },
        unit: {
          type: String,
          required: [true, 'Duration unit is required'],
          enum: ['days', 'weeks', 'months'],
          default: 'days'
        }
      },
      timing: {
        type: String,
        enum: ['before_meals', 'after_meals', 'with_meals', 'on_empty_stomach', 'as_needed'],
        default: 'as_needed'
      },
      specialInstructions: {
        type: String,
        trim: true,
        maxlength: [500, 'Special instructions cannot exceed 500 characters']
      }
    },
    quantityPrescribed: {
      type: Number,
      required: [true, 'Quantity prescribed is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number'
      }
    },
    quantityDispensed: {
      type: Number,
      default: 0,
      min: [0, 'Quantity dispensed cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity dispensed must be a whole number'
      }
    },
    refillsRemaining: {
      type: Number,
      default: 0,
      min: [0, 'Refills remaining cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Refills remaining must be a whole number'
      }
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
    status: {
      type: String,
      enum: ['pending', 'partially_dispensed', 'fully_dispensed', 'substituted', 'cancelled'],
      default: 'pending'
    },
    substitution: {
      allowed: {
        type: Boolean,
        default: true
      },
      substitutedProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      reason: {
        type: String,
        trim: true
      }
    }
  }],
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required'],
    default: Date.now,
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Issue date cannot be in the future'
    },
    index: true
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(date) {
        return date > this.issueDate;
      },
      message: 'Expiry date must be after issue date'
    },
    index: true
  },
  diagnosis: {
    primary: {
      type: String,
      required: [true, 'Primary diagnosis is required'],
      trim: true,
      maxlength: [200, 'Primary diagnosis cannot exceed 200 characters']
    },
    secondary: [{
      type: String,
      trim: true,
      maxlength: [200, 'Secondary diagnosis cannot exceed 200 characters']
    }],
    icdCodes: [{
      code: {
        type: String,
        trim: true
      },
      description: {
        type: String,
        trim: true
      }
    }]
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'partially_filled', 'filled', 'expired', 'cancelled'],
      message: 'Invalid prescription status'
    },
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'stat'],
    default: 'normal'
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  finalAmount: {
    type: Number,
    required: [true, 'Final amount is required'],
    min: [0, 'Final amount cannot be negative']
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
    copayAmount: {
      type: Number,
      min: [0, 'Copay amount cannot be negative'],
      default: 0
    },
    coveragePercentage: {
      type: Number,
      min: [0, 'Coverage percentage cannot be negative'],
      max: [100, 'Coverage percentage cannot exceed 100'],
      default: 0
    },
    preauthorizationNumber: {
      type: String,
      trim: true
    }
  },
  dispensingRecords: [{
    dispensedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dispensedDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    medicationsDispensed: [{
      medicationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      quantityDispensed: {
        type: Number,
        required: true,
        min: [1, 'Quantity dispensed must be at least 1']
      },
      batchNumber: {
        type: String,
        trim: true
      },
      expiryDate: {
        type: Date
      }
    }],
    counselingProvided: {
      type: Boolean,
      default: false
    },
    counselingNotes: {
      type: String,
      trim: true
    },
    patientSignature: {
      type: String,
      trim: true
    }
  }],
  notes: {
    pharmacyNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Pharmacy notes cannot exceed 1000 characters']
    },
    dispensingNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Dispensing notes cannot exceed 1000 characters']
    }
  },
  isControlledSubstance: {
    type: Boolean,
    default: false
  },
  digitalSignature: {
    type: String,
    trim: true
  },
  originalPrescriptionImage: {
    type: String,
    trim: true
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

// Virtual for patient full name
prescriptionSchema.virtual('patient.fullName').get(function() {
  return `${this.patient.firstName} ${this.patient.lastName}`;
});

// Virtual for doctor full name
prescriptionSchema.virtual('doctor.fullName').get(function() {
  return `${this.doctor.firstName} ${this.doctor.lastName}`;
});

// Virtual for patient age
prescriptionSchema.virtual('patient.age').get(function() {
  if (!this.patient.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.patient.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for days until expiry
prescriptionSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diffTime = this.expiryDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for overall completion percentage
prescriptionSchema.virtual('completionPercentage').get(function() {
  if (!this.medications || this.medications.length === 0) return 0;
  
  const totalItems = this.medications.length;
  const fullyDispensed = this.medications.filter(med => 
    med.quantityDispensed >= med.quantityPrescribed
  ).length;
  
  return ((fullyDispensed / totalItems) * 100).toFixed(2);
});

// Virtual for total savings
prescriptionSchema.virtual('totalSavings').get(function() {
  return (this.totalAmount - this.finalAmount).toFixed(2);
});

// Indexes for performance
prescriptionSchema.index({ prescriptionNumber: 1 });
prescriptionSchema.index({ 'patient.firstName': 1, 'patient.lastName': 1 });
prescriptionSchema.index({ 'doctor.licenseNumber': 1 });
prescriptionSchema.index({ issueDate: -1 });
prescriptionSchema.index({ expiryDate: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ priority: 1, issueDate: -1 });
prescriptionSchema.index({ 'medications.product': 1 });

// Text index for search functionality
prescriptionSchema.index({
  prescriptionNumber: 'text',
  'patient.firstName': 'text',
  'patient.lastName': 'text',
  'doctor.firstName': 'text',
  'doctor.lastName': 'text',
  'diagnosis.primary': 'text'
});

// Pre-save middleware
prescriptionSchema.pre('save', function(next) {
  // Calculate total amount from medications
  if (this.medications && this.medications.length > 0) {
    this.totalAmount = this.medications.reduce((total, med) => total + med.totalPrice, 0);
  }
  
  // Calculate final amount
  this.finalAmount = this.totalAmount - this.discountAmount + this.taxAmount;
  
  // Update status based on dispensing
  this.updateStatus();
  
  // Auto-generate prescription number if not provided
  if (!this.prescriptionNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.prescriptionNumber = `RX${timestamp.slice(-8)}${random}`;
  }
  
  next();
});

// Instance method to update prescription status
prescriptionSchema.methods.updateStatus = function() {
  if (this.expiryDate < new Date()) {
    this.status = 'expired';
    return;
  }
  
  if (!this.medications || this.medications.length === 0) {
    this.status = 'pending';
    return;
  }
  
  const totalPrescribed = this.medications.reduce((sum, med) => sum + med.quantityPrescribed, 0);
  const totalDispensed = this.medications.reduce((sum, med) => sum + med.quantityDispensed, 0);
  
  if (totalDispensed === 0) {
    this.status = 'pending';
  } else if (totalDispensed >= totalPrescribed) {
    this.status = 'filled';
  } else {
    this.status = 'partially_filled';
  }
};

// Instance method to dispense medication
prescriptionSchema.methods.dispenseMedication = function(medicationIndex, quantity, dispensedBy, batchNumber, expiryDate) {
  if (medicationIndex >= this.medications.length) {
    throw new Error('Invalid medication index');
  }
  
  const medication = this.medications[medicationIndex];
  const remainingQuantity = medication.quantityPrescribed - medication.quantityDispensed;
  
  if (quantity > remainingQuantity) {
    throw new Error('Cannot dispense more than prescribed');
  }
  
  // Update medication
  medication.quantityDispensed += quantity;
  if (medication.quantityDispensed >= medication.quantityPrescribed) {
    medication.status = 'fully_dispensed';
  } else {
    medication.status = 'partially_dispensed';
  }
  
  // Add dispensing record
  this.dispensingRecords.push({
    dispensedBy,
    dispensedDate: new Date(),
    medicationsDispensed: [{
      medicationId: medication._id,
      quantityDispensed: quantity,
      batchNumber,
      expiryDate
    }]
  });
  
  // Update overall status
  this.updateStatus();
  
  return this.save();
};

// Static method to find expiring prescriptions
prescriptionSchema.statics.findExpiring = function(days = 7) {
  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() + days);
  
  return this.find({
    status: { $nin: ['filled', 'expired', 'cancelled'] },
    expiryDate: { $lte: expiryThreshold, $gte: new Date() }
  }).sort({ expiryDate: 1 });
};

// Static method to find pending prescriptions
prescriptionSchema.statics.findPending = function() {
  return this.find({
    status: { $in: ['pending', 'partially_filled'] },
    expiryDate: { $gte: new Date() }
  }).sort({ priority: -1, issueDate: 1 });
};

// Static method to find by patient
prescriptionSchema.statics.findByPatient = function(firstName, lastName) {
  return this.find({
    'patient.firstName': new RegExp(firstName, 'i'),
    'patient.lastName': new RegExp(lastName, 'i')
  }).sort({ issueDate: -1 });
};

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;