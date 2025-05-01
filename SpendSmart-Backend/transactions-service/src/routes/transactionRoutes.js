// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const {
    createPublicToken,
    exchangeToken,
    getTransactions,
    syncTransactions,
    refreshTransactions
} = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.post('/public_token', createPublicToken);
router.post('/exchange_token', exchangeToken);
router.post('/get', getTransactions);
router.post('/sync', syncTransactions);
router.post('/refresh', refreshTransactions);

module.exports = router;
