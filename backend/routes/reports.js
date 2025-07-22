const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const Sale = require('../models/Sale');
const cron = require('node-cron');

// @route   GET api/reports
// @desc    Get all reports
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const reports = await Report.find().sort({ year: -1, month: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Scheduled job to generate monthly reports
// This will run at midnight on the first day of every month
cron.schedule('0 0 1 * *', async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (0 for January)

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);

  try {
    const sales = await Sale.find({
      createdAt: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth,
      },
    });

    let totalSales = 0;
    let totalItemsSold = 0;
    const reportData = {};

    sales.forEach(sale => {
      totalSales += sale.totalAmount;
      sale.products.forEach(item => {
        totalItemsSold += item.quantity;
      });
    });

    // This is a simple aggregation. More detailed data can be added to reportData.
    reportData.sales = sales;

    const newReport = new Report({
      month: month,
      year: year,
      totalSales,
      totalItemsSold,
      reportData,
    });

    await newReport.save();
    console.log('Monthly report generated successfully.');
  } catch (err) {
    console.error('Error generating monthly report:', err.message);
  }
});


module.exports = router;
