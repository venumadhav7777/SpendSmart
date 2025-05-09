// src/models/Budget.js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    authUser: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    limit: { type: Number, required: true },
    period: { type: String, enum: ['monthly', 'weekly'], default: 'monthly' },
    ownerMail: { type: String, required: true },
    spent: {type: Number, default: 0},
    remaining: {type: Number, default: 0},
    percentUsed: {type: Number, default: 0},
    notificationThresholds: {
        exceeded: { type: Boolean, default: false },
        ninety: { type: Boolean, default: false },
        seventyFive: { type: Boolean, default: false },
        fifty: { type: Boolean, default: false }
    }
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);
