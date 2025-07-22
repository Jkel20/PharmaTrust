const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  totalSales: {
    type: Number,
    required: true,
  },
  totalItemsSold: {
    type: Number,
    required: true,
  },
  reportData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, {
  timestamps: true,
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
