const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Prescription = require('../models/Prescription');
const Supplier = require('../models/Supplier');
const User = require('../models/User');
const { authenticateToken, cashierAndAbove } = require('../middleware/auth');
const { formatResponse, formatErrorResponse } = require('../middleware/utils');

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary data
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
 *                   type: object
 *                   properties:
 *                     totalSales:
 *                       type: number
 *                     totalProducts:
 *                       type: number
 *                     lowStockProducts:
 *                       type: number
 *                     expiringProducts:
 *                       type: number
 *                     pendingPrescriptions:
 *                       type: number
 *                     activeSuppliers:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/summary', authenticateToken, cashierAndAbove, async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get yesterday's date range
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0);
    
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Parallel queries for better performance
    const [
      todaySales,
      yesterdaySales,
      totalProducts,
      lowStockProducts,
      expiringProducts,
      pendingPrescriptions,
      activeSuppliers,
      totalUsers
    ] = await Promise.all([
      // Today's sales
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$finalAmount' },
            totalTransactions: { $sum: 1 },
            totalItems: { $sum: '$totalItems' }
          }
        }
      ]),
      
      // Yesterday's sales
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$finalAmount' },
            totalTransactions: { $sum: 1 },
            totalItems: { $sum: '$totalItems' }
          }
        }
      ]),
      
      // Total products
      Product.countDocuments({ isActive: true }),
      
      // Low stock products
      Product.countDocuments({
        $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
        isActive: true
      }),
      
      // Expiring products (next 30 days)
      Product.countDocuments({
        expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        isActive: true
      }),
      
      // Pending prescriptions
      Prescription.countDocuments({ status: 'pending' }),
      
      // Active suppliers
      Supplier.countDocuments({ isActive: true }),
      
      // Total users
      User.countDocuments({ isActive: true })
    ]);

    // Extract data from aggregation results
    const todayData = todaySales[0] || { totalSales: 0, totalTransactions: 0, totalItems: 0 };
    const yesterdayData = yesterdaySales[0] || { totalSales: 0, totalTransactions: 0, totalItems: 0 };

    // Calculate percentage change
    const salesChange = yesterdayData.totalSales > 0 
      ? ((todayData.totalSales - yesterdayData.totalSales) / yesterdayData.totalSales * 100).toFixed(2)
      : 0;

    const summary = {
      today: {
        sales: todayData.totalSales,
        transactions: todayData.totalTransactions,
        items: todayData.totalItems
      },
      yesterday: {
        sales: yesterdayData.totalSales,
        transactions: yesterdayData.totalTransactions,
        items: yesterdayData.totalItems
      },
      salesChange: parseFloat(salesChange),
      inventory: {
        totalProducts,
        lowStockProducts,
        expiringProducts
      },
      prescriptions: {
        pending: pendingPrescriptions
      },
      suppliers: {
        active: activeSuppliers
      },
      users: {
        total: totalUsers
      }
    };

    res.json(formatResponse(summary, 'Dashboard summary retrieved successfully'));
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch dashboard summary', 500));
  }
});

/**
 * @swagger
 * /api/dashboard/sales:
 *   get:
 *     summary: Get sales analytics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Sales analytics data
 *       401:
 *         description: Unauthorized
 */
router.get('/sales', authenticateToken, cashierAndAbove, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = now;
    }

    // Get sales data
    const salesData = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          totalSales: { $sum: '$finalAmount' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: '$totalItems' },
          averageTransaction: { $avg: '$finalAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get payment method distribution
    const paymentMethods = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$finalAmount' }
        }
      }
    ]);

    // Get top selling products
    const topProducts = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $unwind: '$products'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: '$productDetails'
      },
      {
        $group: {
          _id: '$productDetails._id',
          name: { $first: '$productDetails.name' },
          totalQuantity: { $sum: '$products.quantity' },
          totalRevenue: { $sum: '$products.total' }
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const analytics = {
      period,
      dateRange: {
        start: startDate,
        end: endDate
      },
      salesData,
      paymentMethods,
      topProducts,
      summary: {
        totalSales: salesData.reduce((sum, day) => sum + day.totalSales, 0),
        totalTransactions: salesData.reduce((sum, day) => sum + day.totalTransactions, 0),
        totalItems: salesData.reduce((sum, day) => sum + day.totalItems, 0),
        averageTransaction: salesData.length > 0 
          ? salesData.reduce((sum, day) => sum + day.averageTransaction, 0) / salesData.length 
          : 0
      }
    };

    res.json(formatResponse(analytics, 'Sales analytics retrieved successfully'));
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch sales analytics', 500));
  }
});

/**
 * @swagger
 * /api/dashboard/inventory:
 *   get:
 *     summary: Get inventory analytics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory analytics data
 *       401:
 *         description: Unauthorized
 */
router.get('/inventory', authenticateToken, cashierAndAbove, async (req, res) => {
  try {
    // Get inventory statistics
    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      expiringProducts,
      categoryDistribution,
      stockValue
    ] = await Promise.all([
      // Total products
      Product.countDocuments({ isActive: true }),
      
      // Low stock products
      Product.find({
        $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
        isActive: true
      }).select('name stockQuantity reorderLevel category'),
      
      // Out of stock products
      Product.find({
        stockQuantity: 0,
        isActive: true
      }).select('name category'),
      
      // Expiring products (next 30 days)
      Product.find({
        expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        isActive: true
      }).select('name expiryDate stockQuantity'),
      
      // Category distribution
      Product.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalStock: { $sum: '$stockQuantity' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]),
      
      // Total stock value
      Product.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } }
          }
        }
      ])
    ]);

    const totalValue = stockValue[0]?.totalValue || 0;

    const analytics = {
      summary: {
        totalProducts,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        expiringCount: expiringProducts.length,
        totalValue
      },
      lowStockProducts,
      outOfStockProducts,
      expiringProducts,
      categoryDistribution
    };

    res.json(formatResponse(analytics, 'Inventory analytics retrieved successfully'));
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch inventory analytics', 500));
  }
});

/**
 * @swagger
 * /api/dashboard/alerts:
 *   get:
 *     summary: Get system alerts
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System alerts data
 *       401:
 *         description: Unauthorized
 */
router.get('/alerts', authenticateToken, cashierAndAbove, async (req, res) => {
  try {
    // Get various alerts
    const [
      lowStockAlerts,
      expiringAlerts,
      creditAlerts,
      expiredPrescriptions
    ] = await Promise.all([
      // Low stock alerts
      Product.find({
        $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
        isActive: true
      }).select('name stockQuantity reorderLevel category'),
      
      // Expiring alerts (next 7 days)
      Product.find({
        expiryDate: { 
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          $gte: new Date()
        },
        isActive: true
      }).select('name expiryDate stockQuantity'),
      
      // Credit alerts
      Supplier.find({
        isActive: true,
        $expr: { $gte: ['$currentCredit', { $multiply: ['$creditLimit', 0.8] }] }
      }).select('name currentCredit creditLimit'),
      
      // Expired prescriptions
      Prescription.find({
        prescriptionDate: { $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        status: 'pending'
      }).select('patientName prescriptionDate')
    ]);

    const alerts = {
      lowStock: {
        count: lowStockAlerts.length,
        items: lowStockAlerts
      },
      expiring: {
        count: expiringAlerts.length,
        items: expiringAlerts
      },
      credit: {
        count: creditAlerts.length,
        items: creditAlerts
      },
      expiredPrescriptions: {
        count: expiredPrescriptions.length,
        items: expiredPrescriptions
      },
      total: lowStockAlerts.length + expiringAlerts.length + creditAlerts.length + expiredPrescriptions.length
    };

    res.json(formatResponse(alerts, 'System alerts retrieved successfully'));
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch system alerts', 500));
  }
});

/**
 * @swagger
 * /api/dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity data
 *       401:
 *         description: Unauthorized
 */
router.get('/recent-activity', authenticateToken, cashierAndAbove, async (req, res) => {
  try {
    // Get recent activities
    const [
      recentSales,
      recentPrescriptions,
      recentProducts
    ] = await Promise.all([
      // Recent sales
      Sale.find({ status: 'completed' })
        .populate('soldBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('receiptNumber finalAmount customerName createdAt'),
      
      // Recent prescriptions
      Prescription.find()
        .populate('dispensedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('prescriptionNumber patientName status createdAt'),
      
      // Recent products (low stock or expiring)
      Product.find({
        $or: [
          { $expr: { $lte: ['$stockQuantity', '$reorderLevel'] } },
          { expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
        ],
        isActive: true
      })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('name stockQuantity expiryDate category')
    ]);

    const activity = {
      sales: recentSales,
      prescriptions: recentPrescriptions,
      products: recentProducts
    };

    res.json(formatResponse(activity, 'Recent activity retrieved successfully'));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch recent activity', 500));
  }
});

module.exports = router;