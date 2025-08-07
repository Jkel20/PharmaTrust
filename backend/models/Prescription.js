const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Instructions cannot exceed 500 characters']
  },
  dispensed: {
    type: Boolean,
    default: false
  },
  dispensedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Dispensed quantity cannot be negative']
  },
  dispensedAt: {
    type: Date
  },
  dispensedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const prescriptionSchema = new mongoose.Schema({
  prescriptionNumber: {
    type: String,
    required: [true, 'Prescription number is required'],
    unique: true,
    trim: true
  },
  patient: {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true
    },
    age: {
      type: Number,
      required: [true, 'Patient age is required'],
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age cannot exceed 150']
    },
    gender: {
      type: String,
      required: [true, 'Patient gender is required'],
      enum: {
        values: ['male', 'female', 'other'],
        message: 'Please select a valid gender'
      }
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
    },
    allergies: [{
      type: String,
      trim: true
    }],
    medicalHistory: {
      type: String,
      trim: true,
      maxlength: [1000, 'Medical history cannot exceed 1000 characters']
    }
  },
  doctor: {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true
    },
    licenseNumber: {
      type: String,
      required: [true, 'Doctor license number is required'],
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
    hospital: {
      type: String,
      trim: true
    },
    specialization: {
      type: String,
      trim: true
    }
  },
  items: [prescriptionItemSchema],
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    trim: true,
    maxlength: [500, 'Diagnosis cannot exceed 500 characters']
  },
  prescribedDate: {
    type: Date,
    required: [true, 'Prescribed date is required'],
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: [true, 'Prescription expiry date is required']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['pending', 'dispensed', 'partially_dispensed', 'expired', 'cancelled'],
      message: 'Please select a valid status'
    },
    default: 'pending'
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Please select a valid priority'
    },
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  pharmacist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Pharmacist is required']
  },
  dispensedAt: {
    type: Date
  },
  dispensedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isRefill: {
    type: Boolean,
    default: false
  },
  originalPrescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  refillCount: {
    type: Number,
    default: 0,
    min: [0, 'Refill count cannot be negative']
  },
  maxRefills: {
    type: Number,
    default: 0,
    min: [0, 'Max refills cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items count
prescriptionSchema.virtual('totalItems').get(function() {
  return this.items.length;
});

// Virtual for dispensed items count
prescriptionSchema.virtual('dispensedItemsCount').get(function() {
  return this.items.filter(item => item.dispensed).length;
});

// Virtual for total quantity
prescriptionSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for dispensed quantity
prescriptionSchema.virtual('dispensedQuantity').get(function() {
  return this.items.reduce((total, item) => total + item.dispensedQuantity, 0);
});

// Virtual for days until expiry
prescriptionSchema.virtual('daysUntilExpiry').get(function() {
  const today = new Date();
  const expiryDate = new Date(this.expiryDate);
  return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
});

// Virtual for prescription age
prescriptionSchema.virtual('prescriptionAge').get(function() {
  const today = new Date();
  const prescribedDate = new Date(this.prescribedDate);
  return Math.ceil((today - prescribedDate) / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
prescriptionSchema.index({ prescriptionNumber: 1 });
prescriptionSchema.index({ 'patient.name': 1 });
prescriptionSchema.index({ 'doctor.name': 1 });
prescriptionSchema.index({ pharmacist: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ priority: 1 });
prescriptionSchema.index({ prescribedDate: -1 });
prescriptionSchema.index({ expiryDate: 1 });

// Pre-save middleware to generate prescription number
prescriptionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Get count of prescriptions for today
    const todayPrescriptions = await this.constructor.countDocuments({
      prescribedDate: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      }
    });
    
    this.prescriptionNumber = `PRESC-${year}${month}${day}-${String(todayPrescriptions + 1).padStart(3, '0')}`;
  }
  next();
});

// Pre-save middleware to validate expiry date
prescriptionSchema.pre('save', function(next) {
  if (this.expiryDate && new Date(this.expiryDate) <= new Date()) {
    return next(new Error('Prescription expiry date cannot be in the past'));
  }
  next();
});

// Static method to find prescriptions by status
prescriptionSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('pharmacist', 'firstName lastName');
};

// Static method to find expiring prescriptions
prescriptionSchema.statics.findExpiringSoon = function(days = 7) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  
  return this.find({
    expiryDate: {
      $lte: targetDate,
      $gte: new Date()
    },
    status: { $in: ['pending', 'partially_dispensed'] }
  }).populate('pharmacist', 'firstName lastName');
};

// Static method to find prescriptions by doctor
prescriptionSchema.statics.findByDoctor = function(doctorName) {
  return this.find({
    'doctor.name': { $regex: doctorName, $options: 'i' }
  }).populate('pharmacist', 'firstName lastName');
};

// Static method to find prescriptions by patient
prescriptionSchema.statics.findByPatient = function(patientName) {
  return this.find({
    'patient.name': { $regex: patientName, $options: 'i' }
  }).populate('pharmacist', 'firstName lastName');
};

// Instance method to check if prescription is expired
prescriptionSchema.methods.isExpired = function() {
  return new Date(this.expiryDate) < new Date();
};

// Instance method to check if prescription can be refilled
prescriptionSchema.methods.canBeRefilled = function() {
  return this.refillCount < this.maxRefills && !this.isExpired();
};

// Instance method to dispense prescription
prescriptionSchema.methods.dispense = function(dispensedBy) {
  this.status = 'dispensed';
  this.dispensedAt = new Date();
  this.dispensedBy = dispensedBy;
  
  // Mark all items as dispensed
  this.items.forEach(item => {
    item.dispensed = true;
    item.dispensedQuantity = item.quantity;
    item.dispensedAt = new Date();
    item.dispensedBy = dispensedBy;
  });
  
  return this.save();
};

// Instance method to partially dispense prescription
prescriptionSchema.methods.partiallyDispense = function(itemIndex, quantity, dispensedBy) {
  if (itemIndex >= this.items.length) {
    throw new Error('Invalid item index');
  }
  
  const item = this.items[itemIndex];
  if (quantity > item.quantity - item.dispensedQuantity) {
    throw new Error('Insufficient quantity to dispense');
  }
  
  item.dispensedQuantity += quantity;
  if (item.dispensedQuantity >= item.quantity) {
    item.dispensed = true;
  }
  
  item.dispensedAt = new Date();
  item.dispensedBy = dispensedBy;
  
  // Update overall status
  const allDispensed = this.items.every(item => item.dispensed);
  this.status = allDispensed ? 'dispensed' : 'partially_dispensed';
  
  if (this.status === 'dispensed') {
    this.dispensedAt = new Date();
    this.dispensedBy = dispensedBy;
  }
  
  return this.save();
};

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;