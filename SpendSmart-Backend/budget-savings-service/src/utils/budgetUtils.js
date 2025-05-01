const axios = require('axios');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { mapTransactionCategory } = require('./categoryMap');
// const { sendMail } = require('./emailService');

exports.syncAndCategorize = async (token, userId) => {
  // 1. Refresh
  await axios.post(
    `${process.env.TRANSACTIONS_SERVICE_URL}/api/transactions/refresh`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

  console.log('Refreshed transactions');

  // 2. Sync incremental
  const { data } = await axios.post(
    `${process.env.TRANSACTIONS_SERVICE_URL}/api/transactions/sync`,
    { count: 500 },
    { headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    } }
  );

  console.log(`Synced ${data.added.length} transactions`);

  // 3. Upsert with mapping
  const ops = data.added.map(txn => {
    // ← compute this before you use it
    const budgetCategory = mapTransactionCategory(txn);

    console.log(`Mapped transaction ${txn.transaction_id} by User ${userId} to category ${budgetCategory}`);

    console.log(`Transaction Data ${txn.added}`)

    return {
      updateOne: {
        filter: { transaction_id: txn.transaction_id },
        update: {
          $set: {
            amount: txn.amount,
            date: txn.date,
            name: txn.name,
            category: txn.category,
            pending: txn.pending,
            budgetCategory,           // now properly defined
            user: userId
          },
          $setOnInsert: {
            transaction_id: txn.transaction_id
          }
        },
        upsert: true
      }
    };
  });
  await Transaction.bulkWrite(ops);

};