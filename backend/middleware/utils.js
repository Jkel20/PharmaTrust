// Pagination helper
const paginateResults = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};

// Search helper
const createSearchQuery = (searchTerm, searchFields) => {
  if (!searchTerm) return {};
  
  const searchRegex = new RegExp(searchTerm, 'i');
  const searchQuery = {
    $or: searchFields.map(field => ({
      [field]: searchRegex
    }))
  };
  
  return searchQuery;
};

// Filter helper
const createFilterQuery = (filters) => {
  const filterQuery = {};
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      filterQuery[key] = filters[key];
    }
  });
  
  return filterQuery;
};

// Date range filter
const createDateRangeQuery = (startDate, endDate, dateField = 'createdAt') => {
  const dateQuery = {};
  
  if (startDate) {
    dateQuery.$gte = new Date(startDate);
  }
  
  if (endDate) {
    dateQuery.$lte = new Date(endDate);
  }
  
  return Object.keys(dateQuery).length > 0 ? { [dateField]: dateQuery } : {};
};

// Response formatter
const formatResponse = (data, message = 'Success', success = true) => {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

// Error response formatter
const formatErrorResponse = (message, statusCode = 400) => {
  return {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  };
};

// Calculate total pages
const calculateTotalPages = (totalItems, limit) => {
  return Math.ceil(totalItems / limit);
};

// Generate pagination metadata
const generatePaginationMeta = (page, limit, totalItems) => {
  const totalPages = calculateTotalPages(totalItems, limit);
  
  return {
    currentPage: parseInt(page),
    totalPages,
    totalItems,
    itemsPerPage: parseInt(limit),
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

// Stock level checker
const checkStockLevel = (currentStock, reorderLevel) => {
  if (currentStock <= 0) return 'out_of_stock';
  if (currentStock <= reorderLevel) return 'low_stock';
  return 'in_stock';
};

// Expiry date checker
const checkExpiryStatus = (expiryDate) => {
  if (!expiryDate) return 'no_expiry';
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring_soon';
  return 'valid';
};

// Generate receipt number
const generateReceiptNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `RCP-${timestamp}-${random}`;
};

// Generate prescription number
const generatePrescriptionNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `PRES-${timestamp}-${random}`;
};

// Calculate sale total
const calculateSaleTotal = (products) => {
  return products.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Format currency
const formatCurrency = (amount, currency = 'GHS') => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

module.exports = {
  paginateResults,
  createSearchQuery,
  createFilterQuery,
  createDateRangeQuery,
  formatResponse,
  formatErrorResponse,
  calculateTotalPages,
  generatePaginationMeta,
  checkStockLevel,
  checkExpiryStatus,
  generateReceiptNumber,
  generatePrescriptionNumber,
  calculateSaleTotal,
  formatCurrency
};