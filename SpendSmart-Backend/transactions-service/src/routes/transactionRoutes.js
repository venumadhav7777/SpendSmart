// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const {
    createPublicToken,
    exchangeToken,
    getTransactions,
    syncTransactions,
    refreshTransactions,
    getTransactionsFromDB,
    getBalance
} = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.post('/public_token', createPublicToken);
router.post('/exchange_token', exchangeToken);
router.post('/get', getTransactions);
router.post('/sync', syncTransactions);
router.post('/refresh', refreshTransactions);
router.get('/db', getTransactionsFromDB);
router.get('/balance', getBalance);

module.exports = router;
