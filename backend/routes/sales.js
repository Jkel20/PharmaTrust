const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// @route   POST api/sales
// @desc    Record a sale
// @access  Private
router.post('/', auth, async (req, res) => {
  const { products, totalAmount, pharmacist } = req.body;

  try {
    // Update product quantities
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ msg: `Product with id ${item.product} not found` });
      }
      product.quantity -= item.quantity;
      await product.save();
    }

    const newSale = new Sale({
      products,
      totalAmount,
      pharmacist,
    });

    const sale = await newSale.save();
    res.json(sale);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/sales
// @desc    Get all sales
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find().populate('products.product').populate('pharmacist', 'username');
    res.json(sales);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/sales/:id/receipt
// @desc    Generate a receipt for a sale
// @access  Private
router.get('/:id/receipt', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('products.product').populate('pharmacist', 'username');

    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }

    // Generate a simple text receipt
    let receipt = `Receipt for Sale ID: ${sale._id}\n`;
    receipt += `Date: ${sale.createdAt.toLocaleString()}\n`;
    receipt += `Pharmacist: ${sale.pharmacist.username}\n\n`;
    receipt += 'Products:\n';
    sale.products.forEach(item => {
      receipt += `- ${item.product.name} x ${item.quantity} @ $${item.price.toFixed(2)} each\n`;
    });
    receipt += `\nTotal Amount: $${sale.totalAmount.toFixed(2)}\n`;

    res.set('Content-Type', 'text/plain');
    res.send(receipt);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Sale not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
