const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
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
    default: 'Other',
  },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
