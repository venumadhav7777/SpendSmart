const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['checking', 'savings', 'credit', 'cash', 'other'],
    default: 'other',
  },
  balance: {
    type: Number,
    default: 0,
  },
  noOfExpenses: {
    type: Number,
    default: 0,
  },
  isHidden: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
