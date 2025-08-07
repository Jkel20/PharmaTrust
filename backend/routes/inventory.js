const express = require('express');
const { body, param, query } = require('express-validator');
const Product = require('../models/Product');
const { authenticate, adminOrPharmacist, allRoles } = require('../middleware/authMiddleware');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validationMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all products with filtering and pagination
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: supplier
 *         schema:
 *           type: string
 *         description: Filter by supplier ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, generic name, or manufacturer
 *       - in: query
 *         name: stockStatus
 *         schema:
 *           type: string
 *           enum: [in_stock, low_stock, out_of_stock, overstock]
 *         description: Filter by stock status
 *       - in: query
 *         name: expiryStatus
 *         schema:
 *           type: string
 *           enum: [fresh, expiring_soon, expired]
 *         description: Filter by expiry status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', [authenticate, allRoles], async (req, res) => {
  try {
    const { 
      category, 
      supplier, 
      search, 
      stockStatus, 
      expiryStatus, 
      page = 1, 
      limit = 20, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    const query = { isActive: true };

    // Build query filters
    if (category) query.category = category;
    if (supplier) query.supplier = supplier;
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Stock status filter
    if (stockStatus) {
      switch (stockStatus) {
        case 'out_of_stock':
          query.quantity = 0;
          break;
        case 'low_stock':
          query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
          break;
        case 'overstock':
          query.$expr = { $gte: ['$quantity', '$maxStockLevel'] };
          break;
        case 'in_stock':
          query.quantity = { $gt: 0 };
          query.$expr = { $gt: ['$quantity', '$reorderLevel'] };
          break;
      }
    }

    // Expiry status filter
    if (expiryStatus) {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      switch (expiryStatus) {
        case 'expired':
          query.expiryDate = { $lt: now };
          break;
        case 'expiring_soon':
          query.expiryDate = { $gte: now, $lte: thirtyDaysFromNow };
          break;
        case 'fresh':
          query.expiryDate = { $gt: thirtyDaysFromNow };
          break;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get products with pagination
    const products = await Product.find(query)
      .populate('supplier', 'name contactPerson')
      .populate('createdBy updatedBy', 'firstName lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get inventory error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving inventory'
    });
  }
});

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', [
  authenticate,
  allRoles,
  param('id').isMongoId().withMessage('Invalid product ID'),
  handleValidationErrors
], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplier', 'name contactPerson email phoneNumber')
      .populate('createdBy updatedBy', 'firstName lastName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Get product error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving product'
    });
  }
});

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Add new product to inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', [
  authenticate,
  adminOrPharmacist,
  sanitizeInput,
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 100 })
    .withMessage('Product name cannot exceed 100 characters'),
  body('genericName')
    .trim()
    .notEmpty()
    .withMessage('Generic name is required')
    .isLength({ max: 100 })
    .withMessage('Generic name cannot exceed 100 characters'),
  body('category')
    .isIn(['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'suppository', 'patch', 'powder', 'suspension', 'solution', 'gel', 'spray', 'other'])
    .withMessage('Invalid product category'),
  body('manufacturer')
    .trim()
    .notEmpty()
    .withMessage('Manufacturer is required'),
  body('supplier')
    .isMongoId()
    .withMessage('Valid supplier ID is required'),
  body('batchNumber')
    .trim()
    .notEmpty()
    .withMessage('Batch number is required'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  body('sellingPrice')
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a non-negative number'),
  body('expiryDate')
    .isISO8601()
    .withMessage('Valid expiry date is required')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
  body('reorderLevel')
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
  body('requiresPrescription')
    .isBoolean()
    .withMessage('Requires prescription must be a boolean'),
  handleValidationErrors
], async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.user.id
    };

    const product = new Product(productData);
    await product.save();

    // Populate references for response
    await product.populate('supplier', 'name contactPerson');
    await product.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Product added to inventory successfully',
      product
    });

  } catch (error) {
    console.error('Add product error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error adding product to inventory'
    });
  }
});

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     summary: Update product in inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *               sellingPrice:
 *                 type: number
 *               reorderLevel:
 *                 type: number
 *               maxStockLevel:
 *                 type: number
 *               location:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/:id', [
  authenticate,
  adminOrPharmacist,
  param('id').isMongoId().withMessage('Invalid product ID'),
  sanitizeInput,
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Product name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  body('sellingPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a non-negative number'),
  body('reorderLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
  body('maxStockLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max stock level must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors
], async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'description', 'unitPrice', 'sellingPrice', 'wholesalePrice',
      'discountPercentage', 'taxPercentage', 'reorderLevel', 'maxStockLevel',
      'location', 'storage', 'dosageForm', 'activeIngredients', 'contraindications',
      'sideEffects', 'interactions', 'isActive', 'images', 'documents'
    ];
    
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    updates.updatedBy = req.user.id;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('supplier', 'name contactPerson')
     .populate('updatedBy', 'firstName lastName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update product error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating product'
    });
  }
});

/**
 * @swagger
 * /api/inventory/{id}/adjust-stock:
 *   put:
 *     summary: Adjust product stock quantity
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustment
 *               - reason
 *             properties:
 *               adjustment:
 *                 type: integer
 *                 description: Stock adjustment (positive to add, negative to subtract)
 *               reason:
 *                 type: string
 *                 description: Reason for stock adjustment
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 *       404:
 *         description: Product not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/:id/adjust-stock', [
  authenticate,
  adminOrPharmacist,
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('adjustment')
    .isInt()
    .withMessage('Adjustment must be an integer'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { adjustment, reason } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const oldQuantity = product.quantity;
    await product.adjustStock(adjustment, reason);
    
    // Log the stock adjustment (you might want to create a separate StockMovement model)
    console.log(`Stock adjustment: ${product.name} - ${oldQuantity} -> ${product.quantity} (${adjustment}) - Reason: ${reason} - By: ${req.user.fullName}`);

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      product: {
        id: product._id,
        name: product.name,
        previousQuantity: oldQuantity,
        newQuantity: product.quantity,
        adjustment,
        stockStatus: product.stockStatus
      }
    });

  } catch (error) {
    console.error('Adjust stock error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error adjusting stock'
    });
  }
});

/**
 * @swagger
 * /api/inventory/low-stock:
 *   get:
 *     summary: Get products with low stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock products retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/reports/low-stock', [authenticate, allRoles], async (req, res) => {
  try {
    const lowStockProducts = await Product.findLowStock();

    res.json({
      success: true,
      products: lowStockProducts,
      count: lowStockProducts.length
    });

  } catch (error) {
    console.error('Get low stock error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving low stock products'
    });
  }
});

/**
 * @swagger
 * /api/inventory/expiring:
 *   get:
 *     summary: Get products expiring soon
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to check for expiring products
 *     responses:
 *       200:
 *         description: Expiring products retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/reports/expiring', [authenticate, allRoles], async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const expiringProducts = await Product.findExpiring(parseInt(days));

    res.json({
      success: true,
      products: expiringProducts,
      count: expiringProducts.length,
      days: parseInt(days)
    });

  } catch (error) {
    console.error('Get expiring products error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving expiring products'
    });
  }
});

/**
 * @swagger
 * /api/inventory/expired:
 *   get:
 *     summary: Get expired products
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired products retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/reports/expired', [authenticate, allRoles], async (req, res) => {
  try {
    const expiredProducts = await Product.findExpired();

    res.json({
      success: true,
      products: expiredProducts,
      count: expiredProducts.length
    });

  } catch (error) {
    console.error('Get expired products error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving expired products'
    });
  }
});

/**
 * @swagger
 * /api/inventory/valuation:
 *   get:
 *     summary: Get inventory valuation
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory valuation retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/reports/valuation', [authenticate, adminOrPharmacist], async (req, res) => {
  try {
    const valuationData = await Product.getInventoryValue();

    res.json({
      success: true,
      valuation: valuationData[0] || {
        totalCostValue: 0,
        totalSellingValue: 0,
        totalProducts: 0,
        totalQuantity: 0
      }
    });

  } catch (error) {
    console.error('Get inventory valuation error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving inventory valuation'
    });
  }
});

/**
 * @swagger
 * /api/inventory/search:
 *   get:
 *     summary: Search products by barcode or SKU
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: barcode
 *         schema:
 *           type: string
 *         description: Product barcode
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *         description: Product SKU
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         description: Product not found
 *       400:
 *         description: Barcode or SKU required
 *       401:
 *         description: Unauthorized
 */
router.get('/search/barcode', [authenticate, allRoles], async (req, res) => {
  try {
    const { barcode, sku } = req.query;

    if (!barcode && !sku) {
      return res.status(400).json({
        success: false,
        message: 'Barcode or SKU is required'
      });
    }

    const query = { isActive: true };
    if (barcode) query.barcode = barcode;
    if (sku) query.sku = sku;

    const product = await Product.findOne(query)
      .populate('supplier', 'name contactPerson');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Search product error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error searching product'
    });
  }
});

/**
 * @swagger
 * /api/inventory/{id}:
 *   delete:
 *     summary: Delete product from inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', [
  authenticate,
  adminOrPharmacist,
  param('id').isMongoId().withMessage('Invalid product ID'),
  handleValidationErrors
], async (req, res) => {
  try {
    // Soft delete by setting isActive to false instead of actually deleting
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.user.id },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product removed from inventory successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error removing product from inventory'
    });
  }
});

module.exports = router;