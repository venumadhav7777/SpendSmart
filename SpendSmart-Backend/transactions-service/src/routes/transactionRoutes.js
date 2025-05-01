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
const { protect, verifyServiceToken } = require('../middlewares/authMiddleware');


router.post('/sync', verifyServiceToken, syncTransactions);
router.post('/refresh', verifyServiceToken, refreshTransactions);

router.use(protect);
router.post('/public_token', createPublicToken);
router.post('/exchange_token', exchangeToken);
router.post('/get', getTransactions);

module.exports = router;
