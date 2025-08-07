const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Prescription = require('../models/Prescription');
const { authenticateToken, canGenerateReports } = require('../middleware/auth');
const cron = require('node-cron');

/**
 * @swagger
 * /api/reports/sales:
 *   get:
 *     summary: Get sales reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report
 *     responses:
 *       200:
 *         description: Sales report generated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/sales', authenticateToken, canGenerateReports, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { isVoid: false };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const sales = await Sale.find(query)
      .populate('cashier', 'firstName lastName')
      .populate('items.product', 'name sku price');
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.totalQuantity, 0);
    const averageSale = sales.length > 0 ? totalSales / sales.length : 0;
    
    // Group by payment method
    const paymentMethodStats = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
      return acc;
    }, {});
    
    // Group by cashier
    const cashierStats = sales.reduce((acc, sale) => {
      const cashierName = sale.cashier ? `${sale.cashier.firstName} ${sale.cashier.lastName}` : 'Unknown';
      if (!acc[cashierName]) {
        acc[cashierName] = { count: 0, total: 0 };
      }
      acc[cashierName].count += 1;
      acc[cashierName].total += sale.total;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        summary: {
          totalSales: sales.length,
          totalRevenue: totalSales,
          totalItems,
          averageSale,
          dateRange: { startDate, endDate }
        },
        paymentMethodStats,
        cashierStats,
        sales
      }
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating sales report'
    });
  }
});

/**
 * @swagger
 * /api/reports/inventory:
 *   get:
 *     summary: Get inventory reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory report generated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/inventory', authenticateToken, canGenerateReports, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('supplier', 'name companyName');
    
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + product.totalValue, 0);
    const lowStockProducts = products.filter(product => product.needsReorder());
    const expiringProducts = products.filter(product => product.expiryStatus === 'expiring_soon');
    const expiredProducts = products.filter(product => product.expiryStatus === 'expired');
    
    // Group by category
    const categoryStats = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = { count: 0, totalValue: 0 };
      }
      acc[product.category].count += 1;
      acc[product.category].totalValue += product.totalValue;
      return acc;
    }, {});
    
    // Group by supplier
    const supplierStats = products.reduce((acc, product) => {
      const supplierName = product.supplier ? product.supplier.name : 'Unknown';
      if (!acc[supplierName]) {
        acc[supplierName] = { count: 0, totalValue: 0 };
      }
      acc[supplierName].count += 1;
      acc[supplierName].totalValue += product.totalValue;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalValue,
          lowStockCount: lowStockProducts.length,
          expiringCount: expiringProducts.length,
          expiredCount: expiredProducts.length
        },
        categoryStats,
        supplierStats,
        lowStockProducts,
        expiringProducts,
        expiredProducts
      }
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating inventory report'
    });
  }
});

/**
 * @swagger
 * /api/reports/prescriptions:
 *   get:
 *     summary: Get prescription reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report
 *     responses:
 *       200:
 *         description: Prescription report generated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/prescriptions', authenticateToken, canGenerateReports, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.prescribedDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const prescriptions = await Prescription.find(query)
      .populate('pharmacist', 'firstName lastName')
      .populate('items.product', 'name sku');
    
    const totalPrescriptions = prescriptions.length;
    const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending');
    const dispensedPrescriptions = prescriptions.filter(p => p.status === 'dispensed');
    const expiredPrescriptions = prescriptions.filter(p => p.status === 'expired');
    
    // Group by priority
    const priorityStats = prescriptions.reduce((acc, prescription) => {
      acc[prescription.priority] = (acc[prescription.priority] || 0) + 1;
      return acc;
    }, {});
    
    // Group by pharmacist
    const pharmacistStats = prescriptions.reduce((acc, prescription) => {
      const pharmacistName = prescription.pharmacist ? `${prescription.pharmacist.firstName} ${prescription.pharmacist.lastName}` : 'Unknown';
      if (!acc[pharmacistName]) {
        acc[pharmacistName] = { count: 0, dispensed: 0 };
      }
      acc[pharmacistName].count += 1;
      if (prescription.status === 'dispensed') {
        acc[pharmacistName].dispensed += 1;
      }
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        summary: {
          totalPrescriptions,
          pendingCount: pendingPrescriptions.length,
          dispensedCount: dispensedPrescriptions.length,
          expiredCount: expiredPrescriptions.length,
          dateRange: { startDate, endDate }
        },
        priorityStats,
        pharmacistStats,
        prescriptions
      }
    });
  } catch (error) {
    console.error('Prescription report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating prescription report'
    });
  }
});

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get dashboard summary
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary generated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/dashboard', authenticateToken, canGenerateReports, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Today's sales
    const todaySales = await Sale.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      isVoid: false
    });
    
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const todayItems = todaySales.reduce((sum, sale) => sum + sale.totalQuantity, 0);
    
    // Low stock products
    const lowStockProducts = await Product.findLowStock();
    
    // Expiring products
    const expiringProducts = await Product.findExpiringSoon(7);
    
    // Pending prescriptions
    const pendingPrescriptions = await Prescription.findByStatus('pending');
    
    res.json({
      success: true,
      data: {
        today: {
          sales: todaySales.length,
          revenue: todayRevenue,
          items: todayItems
        },
        alerts: {
          lowStock: lowStockProducts.length,
          expiring: expiringProducts.length,
          pendingPrescriptions: pendingPrescriptions.length
        },
        lowStockProducts,
        expiringProducts,
        pendingPrescriptions
      }
    });
  } catch (error) {
    console.error('Dashboard report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating dashboard report'
    });
  }
});

// Scheduled job to generate daily reports
cron.schedule('0 0 * * *', async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);
    
    const dailySales = await Sale.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      isVoid: false
    });
    
    const totalRevenue = dailySales.reduce((sum, sale) => sum + sale.total, 0);
    
    console.log(`Daily report for ${yesterday.toDateString()}: ${dailySales.length} sales, $${totalRevenue.toFixed(2)} revenue`);
  } catch (error) {
    console.error('Error generating daily report:', error);
  }
});

module.exports = router;
