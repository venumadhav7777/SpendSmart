// src/models/SavingsGoal.js
const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema({
    authUser: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    target: { type: Number, required: true },
    saved: { type: Number, default: 0 },
    deadline: { type: Date },
    ownerMail: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('SavingsGoal', savingsSchema);
