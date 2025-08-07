const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, adminOnly, pharmacistAndAdmin } = require('../middleware/auth');
const { validateUserRegistration, validateId, validatePagination } = require('../middleware/validation');
const { formatResponse, formatErrorResponse, paginateResults, createSearchQuery, generatePaginationMeta } = require('../middleware/utils');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with pagination
 *     tags: [Users]
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
 *         description: Search term for name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, pharmacist, cashier]
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of users
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
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticateToken, pharmacistAndAdmin, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);

    // Build query
    let query = {};
    
    if (search) {
      const searchQuery = createSearchQuery(search, ['firstName', 'lastName', 'email']);
      query = { ...query, ...searchQuery };
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Execute query
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(query);
    const pagination = generatePaginationMeta(page, limit, totalUsers);

    res.json(formatResponse({
      users,
      pagination
    }, 'Users retrieved successfully'));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch users', 500));
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Email already exists
 */
router.post('/', authenticateToken, adminOnly, validateUserRegistration, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json(formatErrorResponse('Email already registered'));
    }

    const user = new User(req.body);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(formatResponse(userResponse, 'User created successfully'));
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 11000) {
      return res.status(409).json(formatErrorResponse('Email already registered'));
    }
    res.status(500).json(formatErrorResponse('Failed to create user', 500));
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
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
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found', 404));
    }

    res.json(formatResponse(user, 'User retrieved successfully'));
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch user', 500));
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, pharmacist, cashier]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */
router.put('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const { firstName, lastName, phone, role, isActive } = req.body;
    
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found', 404));
    }

    // Only admin can change roles
    if (role && req.user.role !== 'admin') {
      return res.status(403).json(formatErrorResponse('Only admins can change user roles', 403));
    }

    // Update user
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (role && req.user.role === 'admin') updateData.role = role;
    if (isActive !== undefined && req.user.role === 'admin') updateData.isActive = isActive;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(formatResponse(updatedUser, 'User updated successfully'));
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json(formatErrorResponse('Failed to update user', 500));
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', authenticateToken, adminOnly, validateId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json(formatErrorResponse('User not found', 404));
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json(formatErrorResponse('Cannot delete your own account'));
    }

    await User.findByIdAndDelete(req.params.id);

    res.json(formatResponse(null, 'User deleted successfully'));
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json(formatErrorResponse('Failed to delete user', 500));
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
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
 *                   $ref: '#/components/schemas/User'
 */
router.get('/profile/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(formatResponse(user, 'Profile retrieved successfully'));
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch profile', 500));
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 */
router.put('/profile/me', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(formatResponse(updatedUser, 'Profile updated successfully'));
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json(formatErrorResponse('Failed to update profile', 500));
  }
});

module.exports = router;