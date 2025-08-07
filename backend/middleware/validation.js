const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
const validateUserRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('phoneNumber')
    .matches(/^(\+?234|0)?[789][01]\d{8}$/)
    .withMessage('Please provide a valid Nigerian phone number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'pharmacist', 'cashier'])
    .withMessage('Role must be admin, pharmacist, or cashier'),
  
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
const validateUserLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Validation rules for user update
 */
const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phoneNumber')
    .optional()
    .matches(/^(\+?234|0)?[789][01]\d{8}$/)
    .withMessage('Please provide a valid Nigerian phone number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'pharmacist', 'cashier'])
    .withMessage('Role must be admin, pharmacist, or cashier'),
  
  handleValidationErrors
];

/**
 * Validation rules for product creation
 */
const validateProductCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('category')
    .isIn([
      'antibiotics', 'painkillers', 'vitamins', 'supplements',
      'first_aid', 'personal_care', 'medical_devices',
      'prescription_drugs', 'otc_medications', 'other'
    ])
    .withMessage('Please select a valid category'),
  
  body('sku')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('SKU must be between 3 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('SKU can only contain uppercase letters and numbers'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('costPrice')
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),
  
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('unit')
    .isIn(['tablets', 'capsules', 'bottles', 'tubes', 'boxes', 'pieces', 'grams', 'milliliters'])
    .withMessage('Please select a valid unit'),
  
  body('reorderLevel')
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
  
  body('reorderQuantity')
    .isInt({ min: 1 })
    .withMessage('Reorder quantity must be at least 1'),
  
  body('expiryDate')
    .isISO8601()
    .withMessage('Please provide a valid expiry date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date cannot be in the past');
      }
      return true;
    }),
  
  body('manufacturer')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Manufacturer must be between 2 and 100 characters'),
  
  body('supplier')
    .isMongoId()
    .withMessage('Please provide a valid supplier ID'),
  
  body('batchNumber')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Batch number must be between 3 and 50 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for product update
 */
const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid expiry date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date cannot be in the past');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validation rules for sale creation
 */
const validateSaleCreation = [
  body('customer.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('customer.phone')
    .optional()
    .matches(/^(\+?234|0)?[789][01]\d{8}$/)
    .withMessage('Please provide a valid Nigerian phone number'),
  
  body('customer.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  
  body('items.*.product')
    .isMongoId()
    .withMessage('Please provide a valid product ID'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  
  body('paymentMethod')
    .isIn(['cash', 'card', 'mobile_money', 'bank_transfer'])
    .withMessage('Please select a valid payment method'),
  
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'partially_paid', 'refunded'])
    .withMessage('Please select a valid payment status'),
  
  handleValidationErrors
];

/**
 * Validation rules for prescription creation
 */
const validatePrescriptionCreation = [
  body('patient.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Patient name must be between 2 and 100 characters'),
  
  body('patient.age')
    .isInt({ min: 0, max: 150 })
    .withMessage('Patient age must be between 0 and 150'),
  
  body('patient.gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Please select a valid gender'),
  
  body('patient.phone')
    .optional()
    .matches(/^(\+?234|0)?[789][01]\d{8}$/)
    .withMessage('Please provide a valid Nigerian phone number'),
  
  body('patient.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('doctor.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Doctor name must be between 2 and 100 characters'),
  
  body('doctor.licenseNumber')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('License number must be between 3 and 50 characters'),
  
  body('doctor.phone')
    .optional()
    .matches(/^(\+?234|0)?[789][01]\d{8}$/)
    .withMessage('Please provide a valid Nigerian phone number'),
  
  body('doctor.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('diagnosis')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Diagnosis must be between 5 and 500 characters'),
  
  body('expiryDate')
    .isISO8601()
    .withMessage('Please provide a valid expiry date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Prescription expiry date cannot be in the past');
      }
      return true;
    }),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Please select a valid priority'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one medication is required'),
  
  body('items.*.product')
    .isMongoId()
    .withMessage('Please provide a valid product ID'),
  
  body('items.*.dosage')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Dosage must be between 2 and 100 characters'),
  
  body('items.*.frequency')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Frequency must be between 2 and 100 characters'),
  
  body('items.*.duration')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Duration must be between 2 and 100 characters'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  handleValidationErrors
];

/**
 * Validation rules for supplier creation
 */
const validateSupplierCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier name must be between 2 and 100 characters'),
  
  body('companyName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('contactPerson.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact person name must be between 2 and 100 characters'),
  
  body('contactPerson.phone')
    .matches(/^(\+?234|0)?[789][01]\d{8}$/)
    .withMessage('Please provide a valid Nigerian phone number'),
  
  body('contactPerson.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('address.street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  
  body('address.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('address.state')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  
  body('businessInfo.businessType')
    .optional()
    .isIn(['manufacturer', 'distributor', 'wholesaler', 'retailer', 'other'])
    .withMessage('Please select a valid business type'),
  
  body('paymentTerms.creditLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be a non-negative number'),
  
  body('paymentTerms.paymentPeriod')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Payment period must be a non-negative integer'),
  
  handleValidationErrors
];

/**
 * Validation rules for ID parameters
 */
const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Please provide a valid ID'),
  
  handleValidationErrors
];

/**
 * Validation rules for pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isString()
    .withMessage('Sort must be a string'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  
  handleValidationErrors
];

/**
 * Validation rules for search
 */
const validateSearch = [
  query('q')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateProductCreation,
  validateProductUpdate,
  validateSaleCreation,
  validatePrescriptionCreation,
  validateSupplierCreation,
  validateId,
  validatePagination,
  validateSearch
};