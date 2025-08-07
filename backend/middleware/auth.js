const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * Middleware to verify JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user with password excluded
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to check if user has specific role
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has specific permission
 */
const authorizePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const isAdmin = (req, res, next) => {
  return authorizeRole('admin')(req, res, next);
};

/**
 * Middleware to check if user is pharmacist
 */
const isPharmacist = (req, res, next) => {
  return authorizeRole('pharmacist', 'admin')(req, res, next);
};

/**
 * Middleware to check if user is cashier
 */
const isCashier = (req, res, next) => {
  return authorizeRole('cashier', 'pharmacist', 'admin')(req, res, next);
};

/**
 * Middleware to check if user can manage users
 */
const canManageUsers = (req, res, next) => {
  return authorizePermission('canManageUsers')(req, res, next);
};

/**
 * Middleware to check if user can manage inventory
 */
const canManageInventory = (req, res, next) => {
  return authorizePermission('canManageInventory')(req, res, next);
};

/**
 * Middleware to check if user can process sales
 */
const canProcessSales = (req, res, next) => {
  return authorizePermission('canProcessSales')(req, res, next);
};

/**
 * Middleware to check if user can manage prescriptions
 */
const canManagePrescriptions = (req, res, next) => {
  return authorizePermission('canManagePrescriptions')(req, res, next);
};

/**
 * Middleware to check if user can generate reports
 */
const canGenerateReports = (req, res, next) => {
  return authorizePermission('canGenerateReports')(req, res, next);
};

/**
 * Middleware to check if user can manage suppliers
 */
const canManageSuppliers = (req, res, next) => {
  return authorizePermission('canManageSuppliers')(req, res, next);
};

/**
 * Middleware to check if user can access their own data or is admin
 */
const canAccessUserData = (req, res, next) => {
  const requestedUserId = req.params.id || req.params.userId;
  
  if (!requestedUserId) {
    return next();
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user._id.toString() === requestedUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only access your own data'
  });
};

/**
 * Middleware to check if user can modify their own data or is admin
 */
const canModifyUserData = (req, res, next) => {
  const requestedUserId = req.params.id || req.params.userId;
  
  if (!requestedUserId) {
    return next();
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user._id.toString() === requestedUserId) {
    // Users can modify their own data but not their role or permissions
    if (req.body.role || req.body.permissions) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot modify your role or permissions'
      });
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only modify your own data'
  });
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizePermission,
  isAdmin,
  isPharmacist,
  isCashier,
  canManageUsers,
  canManageInventory,
  canProcessSales,
  canManagePrescriptions,
  canGenerateReports,
  canManageSuppliers,
  canAccessUserData,
  canModifyUserData
};
