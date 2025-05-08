const mongoose = require('mongoose');

const allowedCategories = [
    'Income',
    'Food', 
    'Transport',
    'Shopping',
    'Debt',
    'Fees',
    'Housing',
    'Entertainment', 
    'Health',
    'Travel',
    'Personal',
    'Subscriptions',
    'Investments',
    'Other'
];

const transactionSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Account'
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    enum: allowedCategories,
    default: 'Other',
  },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
