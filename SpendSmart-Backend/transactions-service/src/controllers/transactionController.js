// // exports.getTransactions = async (req, res) => {
// //     const { accessToken, startDate, endDate } = req.body;

// //     try {
// //         const transactions = await plaidService.getTransactions(accessToken, startDate, endDate);

// //         // Save transactions to the database
// //         const savedTransactions = await Transaction.insertMany(transactions);

// //         res.status(200).json({
// //             message: 'Transactions fetched and saved successfully',
// //             transactions: savedTransactions,
// //         });
// //     } catch (error) {
// //         res.status(500).json({ message: 'Error fetching transactions', error: error.message });
// //     }
// // };


// // exports.syncTransactions = async (req, res) => {
// //     const { accessToken } = req.body; // You should fetch accessToken from the logged-in user or session

// //     try {
// //       const user = await User.findOne({ accessToken });
// //       if (!user) return res.status(404).json({ message: 'User not found' });

// //       const cursor = user.plaidCursor || null; // Fetch the stored cursor, or set it to null if it's the first sync
// //       const nextCursor = await plaidSyncService.syncTransactions(accessToken, cursor);

// //       // Store the new cursor for the next sync operation
// //       user.plaidCursor = nextCursor;
// //       await user.save();

// //       res.status(200).json({
// //         message: 'Transactions synced successfully.',
// //         next_cursor: nextCursor,
// //       });
// //     } catch (error) {
// //       res.status(500).json({ message: 'Error syncing transactions', error: error.message });
// //     }
// //   };

// const Transaction = require('../models/Transaction');
// const User = require('../models/User');
// const { configuration } = require('../utils/plaidUtils');
// const { PlaidApi } = require('plaid');

// const plaidClient = new PlaidApi(configuration);

// // exports.getTransactions = async (req, res) => {
// //   try {
// //     const user = await User.findOne({ userId: req.query.userId }).select('access_token');
// //     if (!user) {
// //       return res.status(404).json({ error: 'User not found' });
// //     }
// //     const access_token = user.access_token;

// //     const response = await plaidClient.transactionsGet({
// //       access_token,
// //       start_date: '2023-01-01',
// //       end_date: '2026-05-31',
// //     });

// //     // console.log('response:', response.data);
// //     console.log('transactions:', response.data.transactions);
// //     res.json(response.data.transactions);
// //   } catch (error) {
// //     console.error('Error fetching transactions:', error);
// //     res.status(500).json({ error: 'Failed to fetch transactions' });
// //   }
// // }

// exports.getTransactions = async (req, res) => {
//   try {
//     // Assume user is already authenticated and you have their access token stored
//     const user = await User.findOne({ userId: req.query.userId }).select('access_token');
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Define date range (example)
//     const startDate = '2023-01-01';
//     const endDate = '2025-12-31';

//     // Paginate through transactions if more than 100
//     let transactions = [];
//     let hasMoreTransactions = true;
//     let offset = 0;
//     const limit = 500;

//     while (hasMoreTransactions) {
//       const response = await plaidClient.transactionsGet({
//         access_token: user.access_token,
//         start_date: startDate,
//         end_date: endDate,
//         options: {
//           count: limit,      // number of transactions to fetch in one call
//           offset: offset,    // start point for pagination
//         },
//       });

//       console.log('response:', response.data);

//       transactions = [...transactions, ...response.data.transactions];
//       offset += limit;

//       // Check if there are more transactions to fetch
//       if (response.data.transactions.length < limit) {
//         hasMoreTransactions = false;
//       }
//     }

//     // Respond with all the fetched transactions
//     // console.log('transactions:', transactions);
//     res.status(200).json(transactions);

//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     res.status(500).json({ error: 'Failed to fetch transactions' });
//   }
// };

// exports.refreshTransactions = async (req, res) => {
//   try {
//     const user = await User.findOne({ userId: req.query.userId }).select('access_token');
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     const access_token = user.access_token;

//     const response = await plaidClient.transactionsRefresh({
//       access_token: access_token
//     });
//     // const response = await plaidClient.transactionsSync({
//     //   access_token: access_token
//     // });

//     console.log('response:', response.data);
//     res.json(response.data);
//   } catch (error) {
//     console.error('Error refreshing transactions:', error);
//     res.status(500).json({ error: 'Failed to refresh transactions' });
//   }
// }

// exports.syncTransactions = async (req, res) => {
//   try {
//     const user = await User.findOne({ userId: req.query.userId }).select('access_token');
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     const access_token = user.access_token;

//     const response = await plaidClient.transactionsSync({
//       access_token: access_token
//     });

//     console.log('response:', response.data);
//     res.json(response.data);
//   } catch (error) {
//     console.error('Error syncing transactions:', error);
//     res.status(500).json({ error: 'Failed to sync transactions' });
//   }
// }



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
