const cron = require('node-cron');
const Product = require('../models/Product');

// This is a placeholder for a real alerting mechanism (e.g., sending an email)
const sendAlert = (message) => {
  console.log(`ALERT: ${message}`);
};

// Scheduled job to check for low stock and expiring products
// This will run every hour
cron.schedule('0 * * * *', async () => {
  try {
    const products = await Product.find();

    products.forEach(product => {
      // Check for low stock
      if (product.quantity <= product.lowStockThreshold) {
        sendAlert(`Low stock for product: ${product.name}. Current quantity: ${product.quantity}`);
      }

      // Check for expiring products (within the next 30 days)
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.setDate(now.getDate() + 30));
      if (product.expiryDate <= thirtyDaysFromNow) {
        sendAlert(`Product nearing expiry: ${product.name}. Expiry date: ${product.expiryDate.toLocaleDateString()}`);
      }
    });
  } catch (err) {
    console.error('Error checking for alerts:', err.message);
  }
});
