const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { authenticateToken, canProcessSales } = require('../middleware/auth');
const { validateSaleCreation, validateId, validatePagination, validateSearch } = require('../middleware/validation');

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Sales retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, validatePagination, validateSearch, async (req, res) => {
  try {
    const { page = 1, limit = 10, q, sort = 'createdAt', order = 'desc' } = req.query;
    
    // Build query
    const query = { isVoid: false };
    
    if (q) {
      query.$or = [
        { saleNumber: { $regex: q, $options: 'i' } },
        { 'customer.name': { $regex: q, $options: 'i' } },
        { receiptNumber: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const sales = await Sale.find(query)
      .populate('cashier', 'firstName lastName')
      .populate('items.product', 'name sku price')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Sale.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      success: true,
      data: {
        sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving sales'
    });
  }
});

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Create a new sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer
 *               - items
 *               - paymentMethod
 *             properties:
 *               customer:
 *                 type: object
 *               items:
 *                 type: array
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sale created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, canProcessSales, validateSaleCreation, async (req, res) => {
  try {
    const { customer, items, paymentMethod, paymentStatus = 'paid', tax = 0, discount = 0, notes } = req.body;
    
    // Validate and process items
    const processedItems = [];
    let subtotal = 0;
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product} not found`
        });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}`
        });
      }
      
      const totalPrice = item.unitPrice * item.quantity;
      subtotal += totalPrice;
      
      processedItems.push({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice,
        discount: item.discount || 0
      });
      
      // Update product quantity
      await product.updateStock(item.quantity, 'subtract');
    }
    
    const total = subtotal + tax - discount;
    
    const sale = new Sale({
      customer,
      items: processedItems,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      paymentStatus,
      cashier: req.user._id,
      notes
    });
    
    await sale.save();
    
    const populatedSale = await Sale.findById(sale._id)
      .populate('cashier', 'firstName lastName')
      .populate('items.product', 'name sku price');
    
    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: { sale: populatedSale }
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating sale'
    });
  }
});

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get sale by ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale retrieved successfully
 *       400:
 *         description: Invalid ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sale not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashier', 'firstName lastName')
      .populate('items.product', 'name sku price');
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }
    
    res.json({
      success: true,
      data: { sale }
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving sale'
    });
  }
});

/**
 * @swagger
 * /api/sales/{id}/void:
 *   put:
 *     summary: Void a sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sale voided successfully
 *       400:
 *         description: Invalid ID or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Sale not found
 *       500:
 *         description: Server error
 */
router.put('/:id/void', authenticateToken, canProcessSales, validateId, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Void reason is required'
      });
    }
    
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }
    
    if (sale.isVoid) {
      return res.status(400).json({
        success: false,
        message: 'Sale is already voided'
      });
    }
    
    // Restore product quantities
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        await product.updateStock(item.quantity, 'add');
      }
    }
    
    await sale.voidSale(reason, req.user._id);
    
    res.json({
      success: true,
      message: 'Sale voided successfully'
    });
  } catch (error) {
    console.error('Void sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while voiding sale'
    });
  }
});

/**
 * @swagger
 * /api/sales/{id}/receipt:
 *   get:
 *     summary: Generate receipt for sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Receipt generated successfully
 *       400:
 *         description: Invalid ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sale not found
 *       500:
 *         description: Server error
 */
router.get('/:id/receipt', authenticateToken, validateId, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashier', 'firstName lastName')
      .populate('items.product', 'name sku price');
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }
    
    // Generate receipt data
    const receipt = {
      saleNumber: sale.saleNumber,
      receiptNumber: sale.receiptNumber,
      date: sale.createdAt,
      customer: sale.customer,
      items: sale.items,
      subtotal: sale.subtotal,
      tax: sale.tax,
      discount: sale.discount,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      cashier: sale.cashier,
      notes: sale.notes
    };
    
    res.json({
      success: true,
      data: { receipt }
    });
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating receipt'
    });
  }
});

module.exports = router;
