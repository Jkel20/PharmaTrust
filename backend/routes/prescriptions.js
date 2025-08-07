const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Product = require('../models/Product');
const { authenticateToken, pharmacistAndAdmin, cashierAndAbove } = require('../middleware/auth');
const { validatePrescription, validateId, validatePagination } = require('../middleware/validation');
const { formatResponse, formatErrorResponse, paginateResults, createSearchQuery, generatePaginationMeta } = require('../middleware/utils');

/**
 * @swagger
 * /api/prescriptions:
 *   get:
 *     summary: Get all prescriptions with pagination
 *     tags: [Prescriptions]
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
 *         description: Search term for patient or doctor name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, dispensed, cancelled]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of prescriptions
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
 *                     $ref: '#/components/schemas/Prescription'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, cashierAndAbove, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);

    // Build query
    let query = {};
    
    if (search) {
      const searchQuery = createSearchQuery(search, ['patientName', 'doctorName']);
      query = { ...query, ...searchQuery };
    }
    
    if (status) {
      query.status = status;
    }

    // Execute query
    const prescriptions = await Prescription.find(query)
      .populate('dispensedBy', 'firstName lastName')
      .skip(skip)
      .limit(limitNum)
      .sort({ prescriptionDate: -1 });

    const totalPrescriptions = await Prescription.countDocuments(query);
    const pagination = generatePaginationMeta(page, limit, totalPrescriptions);

    res.json(formatResponse({
      prescriptions,
      pagination
    }, 'Prescriptions retrieved successfully'));
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch prescriptions', 500));
  }
});

/**
 * @swagger
 * /api/prescriptions:
 *   post:
 *     summary: Create a new prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Prescription'
 *     responses:
 *       201:
 *         description: Prescription created successfully
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
 *                   $ref: '#/components/schemas/Prescription'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, pharmacistAndAdmin, validatePrescription, async (req, res) => {
  try {
    const prescription = new Prescription(req.body);
    await prescription.save();

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('dispensedBy', 'firstName lastName');

    res.status(201).json(formatResponse(populatedPrescription, 'Prescription created successfully'));
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json(formatErrorResponse('Failed to create prescription', 500));
  }
});

/**
 * @swagger
 * /api/prescriptions/{id}:
 *   get:
 *     summary: Get prescription by ID
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     responses:
 *       200:
 *         description: Prescription details
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
 *                   $ref: '#/components/schemas/Prescription'
 *       404:
 *         description: Prescription not found
 */
router.get('/:id', authenticateToken, cashierAndAbove, validateId, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('dispensedBy', 'firstName lastName');
    
    if (!prescription) {
      return res.status(404).json(formatErrorResponse('Prescription not found', 404));
    }

    res.json(formatResponse(prescription, 'Prescription retrieved successfully'));
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch prescription', 500));
  }
});

/**
 * @swagger
 * /api/prescriptions/{id}:
 *   put:
 *     summary: Update prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientName:
 *                 type: string
 *               patientPhone:
 *                 type: string
 *               doctorName:
 *                 type: string
 *               doctorPhone:
 *                 type: string
 *               medications:
 *                 type: array
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prescription updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Prescription not found
 */
router.put('/:id', authenticateToken, pharmacistAndAdmin, validateId, async (req, res) => {
  try {
    const { patientName, patientPhone, doctorName, doctorPhone, medications, notes } = req.body;
    
    // Check if prescription exists
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json(formatErrorResponse('Prescription not found', 404));
    }

    // Cannot update dispensed prescriptions
    if (prescription.status === 'dispensed') {
      return res.status(400).json(formatErrorResponse('Cannot update dispensed prescription'));
    }

    // Update prescription
    const updateData = {};
    if (patientName) updateData.patientName = patientName;
    if (patientPhone) updateData.patientPhone = patientPhone;
    if (doctorName) updateData.doctorName = doctorName;
    if (doctorPhone) updateData.doctorPhone = doctorPhone;
    if (medications) updateData.medications = medications;
    if (notes) updateData.notes = notes;

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('dispensedBy', 'firstName lastName');

    res.json(formatResponse(updatedPrescription, 'Prescription updated successfully'));
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json(formatErrorResponse('Failed to update prescription', 500));
  }
});

/**
 * @swagger
 * /api/prescriptions/{id}/dispense:
 *   post:
 *     summary: Dispense prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalAmount:
 *                 type: number
 *                 description: Total amount for the prescription
 *     responses:
 *       200:
 *         description: Prescription dispensed successfully
 *       400:
 *         description: Prescription already dispensed or cancelled
 *       404:
 *         description: Prescription not found
 */
router.post('/:id/dispense', authenticateToken, pharmacistAndAdmin, validateId, async (req, res) => {
  try {
    const { totalAmount = 0 } = req.body;
    
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json(formatErrorResponse('Prescription not found', 404));
    }

    if (prescription.status !== 'pending') {
      return res.status(400).json(formatErrorResponse('Prescription is not pending'));
    }

    // Check if medications are available in stock
    for (const medication of prescription.medications) {
      const product = await Product.findOne({ 
        name: { $regex: medication.name, $options: 'i' },
        isActive: true
      });
      
      if (!product) {
        return res.status(400).json(formatErrorResponse(`Product not found: ${medication.name}`));
      }
      
      if (!product.canBeSold(medication.quantity)) {
        return res.status(400).json(formatErrorResponse(`Insufficient stock for: ${medication.name}`));
      }
    }

    // Update stock levels
    for (const medication of prescription.medications) {
      const product = await Product.findOne({ 
        name: { $regex: medication.name, $options: 'i' },
        isActive: true
      });
      
      await product.updateStock(-medication.quantity);
    }

    // Dispense prescription
    await prescription.dispense(req.user._id, totalAmount);

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('dispensedBy', 'firstName lastName');

    res.json(formatResponse(populatedPrescription, 'Prescription dispensed successfully'));
  } catch (error) {
    console.error('Error dispensing prescription:', error);
    res.status(500).json(formatErrorResponse('Failed to dispense prescription', 500));
  }
});

/**
 * @swagger
 * /api/prescriptions/{id}/cancel:
 *   post:
 *     summary: Cancel prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     responses:
 *       200:
 *         description: Prescription cancelled successfully
 *       400:
 *         description: Prescription already dispensed or cancelled
 *       404:
 *         description: Prescription not found
 */
router.post('/:id/cancel', authenticateToken, pharmacistAndAdmin, validateId, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json(formatErrorResponse('Prescription not found', 404));
    }

    if (prescription.status !== 'pending') {
      return res.status(400).json(formatErrorResponse('Prescription is not pending'));
    }

    await prescription.cancel();

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('dispensedBy', 'firstName lastName');

    res.json(formatResponse(populatedPrescription, 'Prescription cancelled successfully'));
  } catch (error) {
    console.error('Error cancelling prescription:', error);
    res.status(500).json(formatErrorResponse('Failed to cancel prescription', 500));
  }
});

/**
 * @swagger
 * /api/prescriptions/pending:
 *   get:
 *     summary: Get pending prescriptions
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending prescriptions
 *       401:
 *         description: Unauthorized
 */
router.get('/status/pending', authenticateToken, cashierAndAbove, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ status: 'pending' })
      .populate('dispensedBy', 'firstName lastName')
      .sort({ prescriptionDate: -1 });

    res.json(formatResponse(prescriptions, 'Pending prescriptions retrieved successfully'));
  } catch (error) {
    console.error('Error fetching pending prescriptions:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch pending prescriptions', 500));
  }
});

/**
 * @swagger
 * /api/prescriptions/expired:
 *   get:
 *     summary: Get expired prescriptions
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expired prescriptions
 *       401:
 *         description: Unauthorized
 */
router.get('/status/expired', authenticateToken, pharmacistAndAdmin, async (req, res) => {
  try {
    const prescriptions = await Prescription.findExpired()
      .populate('dispensedBy', 'firstName lastName')
      .sort({ prescriptionDate: -1 });

    res.json(formatResponse(prescriptions, 'Expired prescriptions retrieved successfully'));
  } catch (error) {
    console.error('Error fetching expired prescriptions:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch expired prescriptions', 500));
  }
});

/**
 * @swagger
 * /api/prescriptions/patient/{patientName}:
 *   get:
 *     summary: Get prescriptions by patient name
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientName
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient name
 *     responses:
 *       200:
 *         description: List of prescriptions for patient
 *       401:
 *         description: Unauthorized
 */
router.get('/patient/:patientName', authenticateToken, cashierAndAbove, async (req, res) => {
  try {
    const { patientName } = req.params;
    
    const prescriptions = await Prescription.findByPatient(patientName)
      .populate('dispensedBy', 'firstName lastName');

    res.json(formatResponse(prescriptions, 'Patient prescriptions retrieved successfully'));
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch patient prescriptions', 500));
  }
});

module.exports = router;