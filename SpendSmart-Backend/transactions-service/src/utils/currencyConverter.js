const axios = require('axios');

let cachedRate = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day cache duration

async function fetchUSDtoINRRate() {
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
      throw new Error('EXCHANGE_RATE_API_KEY environment variable is not set');
    }
    // Use exchangerate-api.com Pair endpoint as per user instructions
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/INR`;
    const response = await axios.get(url);
    if (response.data && response.data.result === 'success' && response.data.conversion_rate) {
      return response.data.conversion_rate;
    } else {
      throw new Error('Invalid response from exchangerate-api.com');
    }
  } catch (error) {
    console.error('Error fetching USD to INR exchange rate:', error.message);
    throw error;
  }
}

async function getUSDtoINRRate() {
  const now = Date.now();
  if (cachedRate && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return cachedRate;
  }
  const rate = await fetchUSDtoINRRate();
  cachedRate = rate;
  cacheTimestamp = now;
  return rate;
}

/**
 * Convert amount from USD to INR using latest exchange rate.
 * @param {number} amountUSD Amount in USD
 * @returns {Promise<number>} Amount converted to INR
 */
async function convertUSDtoINR(amountUSD) {
  const rate = await getUSDtoINRRate();
  return amountUSD * rate;
}

module.exports = {
  convertUSDtoINR,
  getUSDtoINRRate
};
