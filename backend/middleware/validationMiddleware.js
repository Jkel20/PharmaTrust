const { validationResult } = require('express-validator');

/**
 * Validation Error Handler Middleware
 * Checks for validation errors and returns formatted response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  
  next();
};

/**
 * Sanitize input middleware
 * Removes any potentially harmful characters
 */
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize all string values in req.body
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove script tags and normalize whitespace
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  
  next();
};

/**
 * Rate limiting for sensitive operations
 */
const sensitiveOperationLimiter = (req, res, next) => {
  // This could be enhanced with Redis for distributed rate limiting
  // For now, it's handled by the global rate limiter in server.js
  next();
};

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  sensitiveOperationLimiter,
};