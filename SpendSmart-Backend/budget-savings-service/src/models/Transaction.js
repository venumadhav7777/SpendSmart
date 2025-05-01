// src/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transaction_id: { type: String, required: true, unique: true },
    account_id: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    name: { type: String },
    category: { type: [String] },
    pending: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    budgetCategory: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
