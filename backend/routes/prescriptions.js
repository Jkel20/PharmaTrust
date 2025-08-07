const express = require('express');
const router = express.Router();

// Placeholder route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Prescriptions route - Implementation coming soon'
  });
});

module.exports = router;