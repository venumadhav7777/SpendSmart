// controllers/transactionController.js
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const client = require('../utils/plaidUtils');

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
      { authUser, authRole, plaidPublicToken: data.public_token},
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
    // upsert into DB
    const ops = data.transactions.map(txn => ({
      updateOne: {
        filter: { transaction_id: txn.transaction_id },
        update: { ...txn, user: user._id },
        upsert: true
      }
    }));
    await Transaction.bulkWrite(ops);
    res.status(200).json({ accounts: data.accounts, total_transactions: data.total_transactions, transactions: data.transactions });
  } catch (err) {
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

    // save new cursor
    user.transactionsCursor = data.next_cursor;
    await user.save();

    // upsert added transactions
    const ops = data.added.map(txn => ({
      updateOne: {
        filter: { transaction_id: txn.transaction_id },
        update: { ...txn, user: user._id },
        upsert: true
      }
    }));
    await Transaction.bulkWrite(ops);

    // delete removals if any
    if (data.removed.length) {
      const ids = data.removed.map(txn => txn.transaction_id);
      await Transaction.deleteMany({ transaction_id: { $in: ids } });
    }

    res.json({ added: data.added.length, has_more: data.has_more });
  } catch (err) {
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
