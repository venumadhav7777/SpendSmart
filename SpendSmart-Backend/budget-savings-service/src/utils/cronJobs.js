// src/utils/cronJobs.js
const cron = require('node-cron');                                  // :contentReference[oaicite:0]{index=0}
const axios = require('axios');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { mapTransactionCategory, loadCategoryMap } = require('./categoryMap');
const { sendMail } = require('./emailService');
const fetchedEmails = {};  // cache by userId

async function getEmailFor(userId) {
  if (!fetchedEmails[userId]) {
    const resp = await axios.get(
      `${process.env.AUTH_SERVICE_URL}/api/users/${userId}/profile`,
      {
        headers: {
          'x-api-key': process.env.SERVICE_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    fetchedEmails[userId] = resp.data.email;
  }
  return fetchedEmails[userId];
}
/**
 * syncAndCategorize
 * - Fetch new transactions from your Transactions Service
 * - Map each txn to a budgetCategory
 * - Upsert into local Transaction collection
 * - Recalculate budgets and send alerts if needed
 */
async function syncAndCategorize() {
  try {
    console.log('Starting transaction sync and categorization...');

    await axios.post(
      `${process.env.TRANSACTIONS_SERVICE_URL}/api/transactions/refresh`,
      { count: 500 },
      {
        headers: {
          'x-api-key': process.env.SERVICE_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    // 1. Fetch from Transactions Service
    console.log('Step 1: Fetching transactions from service...');
    const { data } = await axios.post(
      `${process.env.TRANSACTIONS_SERVICE_URL}/api/transactions/sync`,
      { count: 500 },
      {
        headers: {
          'x-api-key': process.env.SERVICE_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`Retrieved ${data.added.length} new transactions`);

    // 2. Map & upsert each transaction
    console.log('Step 2: Mapping and upserting transactions...');
    const ops = data.added.map(txn => {
      const budgetCategory = mapTransactionCategory(txn);
      return {
        updateOne: {
          filter: { transaction_id: txn.transaction_id },
          update: { ...txn, budgetCategory, user: txn.user },
          upsert: true
        }
      };
    });
    await Transaction.bulkWrite(ops);
    console.log(`Upserted ${ops.length} transactions`);

    // 3. For each affected budget, recalc and possibly notify
    console.log('Step 3: Recalculating budgets and sending notifications...');
    const uniqueCats = [...new Set(data.added.map(txn => mapTransactionCategory(txn)))];
    console.log(`Processing ${uniqueCats.length} unique categories`);

    for (const category of uniqueCats) {
      const budgets = await Budget.find({ category });
      console.log(`Found ${budgets.length} budgets for category ${category}`);

      for (const b of budgets) {
        // sum spent in this budget's period
        const email = await getEmailFor(b.authUser.toString());
        const now = new Date();
        const startDate = b.period === 'monthly'
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : new Date(now.setDate(now.getDate() - now.getDay()));

        const agg = await Transaction.aggregate([
          { $match: { budgetCategory: category, date: { $gte: startDate } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const spent = agg.length ? agg[0].total : 0;
        console.log(`Budget ${b.name}: spent $${spent} of $${b.limit}`);

        if (spent > b.limit) {
          // send notification if over budget
          console.log(`Budget exceeded for ${b.name}, sending notification...`);
          await sendMail({
            to: email,  // or fetch user's email
            subject: `Budget Exceeded: ${b.name}`,
            text: `You've spent $${spent} on ${b.name} (limit $${b.limit}).`
          });
        }
      }
    }
    console.log('Sync and categorization completed successfully');
  } catch (err) {
    console.error('Cron sync error:', err);
  }
}

/**
 * scheduleJobs
 * Sets up cron schedules for syncAndCategorize
 */
function scheduleJobs() {
  // daily at midnight
  cron.schedule('0 0 * * *', syncAndCategorize, {
    scheduled: true,
    timezone: 'UTC'
  });                                                            // :contentReference[oaicite:4]{index=4}

  // every hour on the hour
  cron.schedule('* * * * *', syncAndCategorize, {
    scheduled: true,
    timezone: 'UTC'
  });
}

module.exports = { scheduleJobs };
