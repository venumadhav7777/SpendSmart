// const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
// require('dotenv').config();

// const configuration = new Configuration({
//     basePath: PlaidEnvironments.sandbox,
//     baseOptions: {
//         headers: {
//             'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
//             'PLAID-SECRET': process.env.PLAID_SECRET,
//         },
//     },
// });

// module.exports = configuration;

// utils/plaidClient.js
const axios = require('axios');
require('dotenv').config();

const PLAID_BASE = `https://${process.env.PLAID_ENV}.plaid.com`;

const client = axios.create({
  baseURL: PLAID_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// inject your client_id & secret on every request
client.interceptors.request.use(cfg => {
  cfg.data = {
    client_id: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
    ...cfg.data
  };
  return cfg;
});

module.exports = client;
