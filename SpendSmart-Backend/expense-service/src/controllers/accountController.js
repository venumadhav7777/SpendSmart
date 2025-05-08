const Account = require('../models/Account');

// Create a new account associated with the authenticated user
exports.createAccount = async (req, res) => {
  try {
    const { name, type, balance } = req.body;
    const userId = req.user.id;

    const account = new Account({
      userId,
      name,
      type,
      balance,
    });

    const savedAccount = await account.save();
    res.status(201).json(savedAccount);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create account', error: error.message });
  }
};

// Get all accounts for the authenticated user
exports.getAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    const accounts = await Account.find({ userId });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch accounts', error: error.message });
  }
};

// Get a single account by id, only if it belongs to the authenticated user
exports.getAccountById = async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;

    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch account', error: error.message });
  }
};

// Update an account by id, only if it belongs to the authenticated user
exports.updateAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;
    const { name, type, balance } = req.body;

    const account = await Account.findOneAndUpdate(
      { _id: accountId, userId },
      { name, type, balance },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ message: 'Account not found or not authorized' });
    }

    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update account', error: error.message });
  }
};

// Delete an account by id, only if it belongs to the authenticated user
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;

    const account = await Account.findOneAndDelete({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({ message: 'Account not found or not authorized' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
};
