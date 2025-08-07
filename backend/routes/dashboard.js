const express = require('express');
const router = express.Router();

// Placeholder route
router.get('/overview', (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard route - Implementation coming soon'
  });
});

module.exports = router;