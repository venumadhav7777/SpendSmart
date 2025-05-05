// controllers/transactionController.js
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const client = require('../utils/plaidUtils');
const { mapPlaidCategory, debugCategoryMapping } = require('../utils/categoryUtils');
const mongoose = require('mongoose');

// 1. Sandbox: create a public_token
exports.createPublicToken = async (req, res) => {
  try {
    const { institution_id, initial_products = ['transactions'] } = req.body;
    // institution_id = institution_id ? institution_id : 'ins_20';
    const { data } = await client.post('/sandbox/public_token/create', {
      institution_id,
      initial_products,
      options: {
        webhook: "https://www.genericwebhookurl.com/webhook",
        override_username: "user_transactions_dynamic",
        override_password: "test"
      }
    });
    // extract userId and role from JWT
    const { id: authUser, role: authRole } = req.user;

    // upsert a single document in one call:
    const user = await User.findOneAndUpdate(
      { authUser },                        // query by authUser
      { authUser, authRole, plaidPublicToken: data.public_token },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
};

// 2. Exchange public_token for access_token
exports.exchangeToken = async (req, res) => {
  try {
    const { id: authUser } = req.user;
    const user = await User.findOne({ authUser: authUser });
    console.log(user);
    const { data } = await client.post('/item/public_token/exchange', {
      public_token: user.plaidPublicToken
    });
    user.plaidAccessToken = data.access_token;
    user.itemId = data.item_id;
    user.transactionsCursor = null;
    await user.save();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
};

// 3. Get transactions in a date range
exports.getTransactions = async (req, res) => {
  try {
    const { id: authUser } = req.user;
    const { start_date, end_date } = req.body;
    const user = await User.findOne({ authUser: authUser }).select('+plaidAccessToken');
    const { data } = await client.post('/transactions/get', {
      access_token: user.plaidAccessToken,
      start_date,
      end_date,
    });

    // Update user balance from accounts
    if (data.accounts && data.accounts.length > 0) {
      console.log("accounts: ", data.accounts);
      const totalBalance = data.accounts.reduce((sum, account) => {
        return sum + (account.balances.available || 0);
      }, 0);
      console.log("totalBalance: ", totalBalance);
      user.balance = totalBalance;
      await user.save();
    }

    // Process and map categories for each transaction
    const processedTransactions = data.transactions.map(txn => {
      // Debug the category mapping
      console.log('Processing transaction:', txn.name);
      const mappedCategory = debugCategoryMapping(txn.personal_finance_category);
      
      return {
        ...txn,
        mapped_category: mappedCategory,
        category: txn.category || [], // Keep original Plaid categories
        personal_finance_category: txn.personal_finance_category // Keep original PFC
      };
    });

    // upsert into DB
    const ops = processedTransactions.map(txn => ({
      updateOne: {
        filter: {
          transaction_id: txn.transaction_id,
          user: user._id
        },
        update: {
          $set: {
            ...txn,
            user: user._id,
            unique_transaction_id: `${user._id}_${txn.transaction_id}`,
            category: txn.category || [],
            mapped_category: txn.mapped_category
          }
        },
        upsert: true
      }
    }));
    await Transaction.bulkWrite(ops);
    res.status(200).json({ accounts: data.accounts, total_transactions: data.total_transactions, transactions: processedTransactions });
  } catch (err) {
    console.error('Error in getTransactions:', err);
    res.status(500).json({ error: err.response?.data || err.message });
  }
};

// 4. Sync incremental updates
exports.syncTransactions = async (req, res) => {
  try {
    const { id: authUser } = req.user;
    const user = await User.findOne({ authUser: authUser }).select('+plaidAccessToken +transactionsCursor');

    const { data } = await client.post('/transactions/sync', {
      access_token: user.plaidAccessToken,
      cursor: user.transactionsCursor,
      count: 500
    });

    // Update user balance from accounts if available
    if (data.accounts && data.accounts.length > 0) {
      const totalBalance = data.accounts.reduce((sum, account) => {
        return sum + (account.balances.available || 0);
      }, 0);
      user.balance = totalBalance;
    }

    // save new cursor
    user.transactionsCursor = data.next_cursor;
    await user.save();

    // Process and map categories for added transactions
    const processedAddedTransactions = data.added.map(txn => {
      // Debug the category mapping
      console.log('Processing transaction:', txn.name);
      const mappedCategory = debugCategoryMapping(txn.personal_finance_category);
      
      return {
        ...txn,
        mapped_category: mappedCategory,
        category: txn.category || [],
        personal_finance_category: txn.personal_finance_category
      };
    });

    // upsert added transactions
    const ops = processedAddedTransactions.map(txn => ({
      updateOne: {
        filter: {
          transaction_id: txn.transaction_id,
          user: user._id
        },
        update: {
          $set: {
            ...txn,
            user: user._id,
            unique_transaction_id: `${user._id}_${txn.transaction_id}`,
            category: txn.category || [],
            mapped_category: txn.mapped_category
          }
        },
        upsert: true
      }
    }));
    await Transaction.bulkWrite(ops);

    // delete removals if any
    if (data.removed.length) {
      const ids = data.removed.map(txn => txn.transaction_id);
      await Transaction.deleteMany({
        transaction_id: { $in: ids },
        user: user._id
      });
    }

    res.status(200).json({
      ...data,
      added: processedAddedTransactions
    });
  } catch (err) {
    console.error('Error in syncTransactions:', err);
    res.status(500).json({ error: err.response?.data || err.message });
  }
};

// 5. Force-refresh transactions
exports.refreshTransactions = async (req, res) => {
  try {
    const { id: authUser } = req.user;
    const user = await User.findOne({ authUser: authUser }).select('+plaidAccessToken');
    const { data } = await client.post('/transactions/refresh', {
      access_token: user.plaidAccessToken
    });
    res.json({ refreshed: true });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
};

exports.getTransactionsFromDB = async (req, res) => {
  try {
    const { id: authUser } = req.user;
    const user = await User.findOne({ authUser: authUser });
    const transactions = await Transaction.find({ user: user._id })
      .sort({ date: -1 })
      .limit(1000);
    // console.log(transactions);
    res.status(200).json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// New endpoint to get user balance
exports.getBalance = async (req, res) => {
  try {
    const { id: authUser } = req.user;
    const user = await User.findOne({ authUser: authUser });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      balance: user.balance || 0,
      lastUpdated: user.updatedAt
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
};

