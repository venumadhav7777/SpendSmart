// src/models/SavingsGoal.js
const mongoose = require('mongoose');

/**
 * Each contribution is recorded with its date, amount, and type.
 */
const contributionSchema = new mongoose.Schema({
  date:   { type: Date,   default: Date.now },
  amount: { type: Number, required: true },
  // 'manual' for user-initiated, 'auto' for 50/30/20 allocations
  type:   { type: String, enum: ['manual','auto'], required: true }
}, { _id: false });  // no separate _id for each subdoc :contentReference[oaicite:0]{index=0}

const savingsSchema = new mongoose.Schema({
  authUser:      { type: mongoose.Schema.Types.ObjectId, required: true },
  name:          { type: String, required: true },
  target:        { type: Number, required: true },
  saved:         { type: Number, default: 0 },
  deadline:      { type: Date },
  ownerMail:     { type: String, required: true },
  contributions: { type: [contributionSchema], default: [] },  // subdocument array :contentReference[oaicite:1]{index=1}
  goalReachedNotified: { type: Boolean, default: false }  // Track if goal completion email was sent
}, { timestamps: true });

module.exports = mongoose.model('SavingsGoal', savingsSchema);
