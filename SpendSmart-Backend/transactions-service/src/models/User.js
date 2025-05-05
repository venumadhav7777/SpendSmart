// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  authUser: {
    type: mongoose.Schema.Types.ObjectId,     // or ObjectId if you sync user IDs across services
    required: true
  },
  authRole: {
    type: String,
    required: true
  },
  plaidPublicToken: { type: String },
  plaidAccessToken: { type: String, select: false },
  itemId: { type: String },
  balance: { type: Number, default: 0 },
  transactionsCursor: { type: String, default: null },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
