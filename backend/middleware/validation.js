const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('role')
    .isIn(['admin', 'pharmacist', 'cashier'])
    .withMessage('Role must be admin, pharmacist, or cashier'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Product validation rules
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('reorderLevel')
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  handleValidationErrors
];

// Sale validation rules
const validateSale = [
  body('products')
    .isArray({ min: 1 })
    .withMessage('At least one product is required'),
  body('products.*.productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('products.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('customerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'mobile_money'])
    .withMessage('Payment method must be cash, card, or mobile_money'),
  handleValidationErrors
];

// Prescription validation rules
const validatePrescription = [
  body('patientName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Patient name must be between 2 and 100 characters'),
  body('doctorName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Doctor name must be between 2 and 100 characters'),
  body('medications')
    .isArray({ min: 1 })
    .withMessage('At least one medication is required'),
  body('medications.*.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Medication name must be between 2 and 100 characters'),
  body('medications.*.dosage')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Dosage must be between 1 and 50 characters'),
  body('prescriptionDate')
    .isISO8601()
    .withMessage('Prescription date must be a valid date'),
  body('status')
    .optional()
    .isIn(['pending', 'dispensed', 'cancelled'])
    .withMessage('Status must be pending, dispensed, or cancelled'),
  handleValidationErrors
];

// Supplier validation rules
const validateSupplier = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  handleValidationErrors
];

// ID validation
const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProduct,
  validateSale,
  validatePrescription,
  validateSupplier,
  validateId,
  validatePagination
};