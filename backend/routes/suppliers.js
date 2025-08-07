const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { authenticateToken, adminOnly, pharmacistAndAdmin } = require('../middleware/auth');
const { validateSupplier, validateId, validatePagination } = require('../middleware/validation');
const { formatResponse, formatErrorResponse, paginateResults, createSearchQuery, generatePaginationMeta } = require('../middleware/utils');

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Get all suppliers with pagination
 *     tags: [Suppliers]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for supplier name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, pharmacistAndAdmin, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);

    // Build query
    let query = {};
    
    if (search) {
      const searchQuery = createSearchQuery(search, ['name', 'contactPerson', 'email']);
      query = { ...query, ...searchQuery };
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Execute query
    const suppliers = await Supplier.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const totalSuppliers = await Supplier.countDocuments(query);
    const pagination = generatePaginationMeta(page, limit, totalSuppliers);

    res.json(formatResponse({
      suppliers,
      pagination
    }, 'Suppliers retrieved successfully'));
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch suppliers', 500));
  }
});

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Supplier'
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, adminOnly, validateSupplier, async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();

    res.status(201).json(formatResponse(supplier, 'Supplier created successfully'));
  } catch (error) {
    console.error('Error creating supplier:', error);
    if (error.code === 11000) {
      return res.status(409).json(formatErrorResponse('Supplier with this name already exists'));
    }
    res.status(500).json(formatErrorResponse('Failed to create supplier', 500));
  }
});

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       404:
 *         description: Supplier not found
 */
router.get('/:id', authenticateToken, pharmacistAndAdmin, validateId, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json(formatErrorResponse('Supplier not found', 404));
    }

    res.json(formatResponse(supplier, 'Supplier retrieved successfully'));
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch supplier', 500));
  }
});

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               creditLimit:
 *                 type: number
 *               paymentTerms:
 *                 type: string
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Supplier not found
 */
router.put('/:id', authenticateToken, adminOnly, validateId, async (req, res) => {
  try {
    const {
      name, email, phone, address, contactPerson,
      creditLimit, paymentTerms, notes, isActive
    } = req.body;
    
    // Check if supplier exists
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json(formatErrorResponse('Supplier not found', 404));
    }

    // Update supplier
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (contactPerson) updateData.contactPerson = contactPerson;
    if (creditLimit !== undefined) updateData.creditLimit = creditLimit;
    if (paymentTerms) updateData.paymentTerms = paymentTerms;
    if (notes) updateData.notes = notes;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(formatResponse(updatedSupplier, 'Supplier updated successfully'));
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json(formatErrorResponse('Failed to update supplier', 500));
  }
});

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Delete supplier (Admin only)
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 *       404:
 *         description: Supplier not found
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', authenticateToken, adminOnly, validateId, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json(formatErrorResponse('Supplier not found', 404));
    }

    // Check if supplier has outstanding credit
    if (supplier.currentCredit > 0) {
      return res.status(400).json(formatErrorResponse('Cannot delete supplier with outstanding credit'));
    }

    await Supplier.findByIdAndDelete(req.params.id);

    res.json(formatResponse(null, 'Supplier deleted successfully'));
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json(formatErrorResponse('Failed to delete supplier', 500));
  }
});

/**
 * @swagger
 * /api/suppliers/{id}/credit:
 *   post:
 *     summary: Update supplier credit
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to add (positive) or subtract (negative)
 *               type:
 *                 type: string
 *                 enum: [add, subtract]
 *                 description: Type of credit operation
 *     responses:
 *       200:
 *         description: Credit updated successfully
 *       400:
 *         description: Invalid amount or operation
 *       404:
 *         description: Supplier not found
 */
router.post('/:id/credit', authenticateToken, adminOnly, validateId, async (req, res) => {
  try {
    const { amount, type } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json(formatErrorResponse('Amount must be a positive number'));
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json(formatErrorResponse('Supplier not found', 404));
    }

    let newCredit;
    if (type === 'add') {
      newCredit = supplier.currentCredit + amount;
    } else if (type === 'subtract') {
      newCredit = Math.max(0, supplier.currentCredit - amount);
    } else {
      return res.status(400).json(formatErrorResponse('Invalid operation type'));
    }

    supplier.currentCredit = newCredit;
    await supplier.save();

    res.json(formatResponse(supplier, 'Credit updated successfully'));
  } catch (error) {
    console.error('Error updating supplier credit:', error);
    res.status(500).json(formatErrorResponse('Failed to update supplier credit', 500));
  }
});

/**
 * @swagger
 * /api/suppliers/active:
 *   get:
 *     summary: Get active suppliers
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active suppliers
 *       401:
 *         description: Unauthorized
 */
router.get('/status/active', authenticateToken, pharmacistAndAdmin, async (req, res) => {
  try {
    const suppliers = await Supplier.findActive().sort({ name: 1 });

    res.json(formatResponse(suppliers, 'Active suppliers retrieved successfully'));
  } catch (error) {
    console.error('Error fetching active suppliers:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch active suppliers', 500));
  }
});

/**
 * @swagger
 * /api/suppliers/credit-issues:
 *   get:
 *     summary: Get suppliers with credit issues
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suppliers with credit issues
 *       401:
 *         description: Unauthorized
 */
router.get('/status/credit-issues', authenticateToken, adminOnly, async (req, res) => {
  try {
    const suppliers = await Supplier.findWithCreditIssues().sort({ currentCredit: -1 });

    res.json(formatResponse(suppliers, 'Suppliers with credit issues retrieved successfully'));
  } catch (error) {
    console.error('Error fetching suppliers with credit issues:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch suppliers with credit issues', 500));
  }
});

/**
 * @swagger
 * /api/suppliers/{id}/products:
 *   get:
 *     summary: Get products by supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: List of products from supplier
 *       404:
 *         description: Supplier not found
 */
router.get('/:id/products', authenticateToken, pharmacistAndAdmin, validateId, async (req, res) => {
  try {
    const Product = require('../models/Product');
    
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json(formatErrorResponse('Supplier not found', 404));
    }

    const products = await Product.find({ supplier: req.params.id, isActive: true })
      .select('name price stockQuantity category expiryDate')
      .sort({ name: 1 });

    res.json(formatResponse(products, 'Supplier products retrieved successfully'));
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch supplier products', 500));
  }
});

module.exports = router;