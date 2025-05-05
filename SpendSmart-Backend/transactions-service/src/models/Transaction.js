// models/Transaction.js
const mongoose = require('mongoose');

const counterpartySchema = new mongoose.Schema({
  confidence_level: String,
  entity_id: String,
  logo_url: String,
  name: String,
  phone_number: String,
  type: String,
  website: String
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    required: true
  },
  unique_transaction_id: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  account_id: String,
  amount: Number,
  date: Date,
  name: String,
  merchant_name: String,
  category: [String],
  mapped_category: {
    primary: {
      type: String,
      required: true,
      default: 'OTHER'
    },
    detailed: {
      type: String,
      required: true,
      default: 'OTHER'
    },
    description: {
      type: String,
      required: true,
      default: 'Other'
    },
    confidence: {
      type: String,
      enum: ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW'],
      default: 'LOW'
    }
  },
  personal_finance_category: {
    primary: String,
    detailed: String,
    confidence_level: String
  },
  pending: Boolean,
  payment_channel: String,
  iso_currency_code: String,
  unofficial_currency_code: String,
  website: String,
  logo_url: String,
  counterparties: [counterpartySchema]
}, {
  timestamps: true
});

// Create compound index for transaction_id and user
transactionSchema.index({ transaction_id: 1, user: 1 }, { unique: true });

// Create index for date for better query performance
transactionSchema.index({ date: -1 });

// Create index for mapped_category for better query performance
transactionSchema.index({ 'mapped_category.primary': 1, 'mapped_category.detailed': 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
