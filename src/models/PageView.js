const mongoose = require('mongoose');

const pageViewSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PageView', pageViewSchema);
