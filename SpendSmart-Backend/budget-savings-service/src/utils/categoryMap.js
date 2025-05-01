const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

let primaryToDetailed = {};

/**
 * loadCategoryMap
 * Reads the taxonomy CSV and builds an in‐memory map:
 *   primaryCategory → [detailedCategory1, detailedCategory2, …]
 */
function loadCategoryMap() {
  return new Promise((resolve, reject) => {
    const map = {};
    fs.createReadStream(path.join(__dirname, '../data/pfc_taxonomy.csv'))
      .pipe(csv({ headers: ['primary','detailed','description'] }))
      .on('data', ({ primary, detailed }) => {
        if (!map[primary]) map[primary] = new Set();
        map[primary].add(detailed);
      })
      .on('end', () => {
        // convert Sets to Arrays
        primaryToDetailed = Object.fromEntries(
          Object.entries(map).map(([k, set]) => [k, Array.from(set)])
        );
        resolve();
      })
      .on('error', reject);
  });
}

/**
 * mapTransactionCategory
 * Given a transaction’s Plaid PFC object, map to your internal category
 */
function mapTransactionCategory(txn) {
  const pfc = txn.personal_finance_category;
  if (!pfc || !pfc.primary) return 'Uncategorized';

  // Example internal mapping; adjust keys to your budget categories
  const internalMap = {
    INCOME:            'Income',
    FOOD_AND_DRINK:    'Food',
    TRANSPORTATION:    'Transport',
    GENERAL_MERCHANDISE: 'Shopping',
    LOAN_PAYMENTS:     'Debt',
    BANK_FEES:         'Fees',
    RENT_AND_UTILITIES:'Housing',
    ENTERTAINMENT:     'Entertainment',
    HEALTHCARE:        'Health',
    TRAVEL:            'Travel',
    PERSONAL_CARE:     'Personal',
    SUBSCRIPTIONS:     'Subscriptions',
    INVESTMENTS:       'Investments',
    OTHER:             'Other'
  };

  // first try internalMap
  if (internalMap[pfc.primary]) {
    return internalMap[pfc.primary];
  }

  // fallback: use detailed level if exists in CSV map
  const detailedList = primaryToDetailed[pfc.primary] || [];
  if (detailedList.includes(pfc.detailed)) {
    // e.g. map "FOOD_AND_DRINK_GROCERIES" → "Food"
    return internalMap[pfc.primary] || pfc.primary;
  }

  return 'Uncategorized';
}

module.exports = { loadCategoryMap, mapTransactionCategory };
