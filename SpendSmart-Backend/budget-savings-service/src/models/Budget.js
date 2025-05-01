// src/models/Budget.js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    authUser: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    limit: { type: Number, required: true },
    period: { type: String, enum: ['monthly', 'weekly'], default: 'monthly' },
    ownerMail: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);
