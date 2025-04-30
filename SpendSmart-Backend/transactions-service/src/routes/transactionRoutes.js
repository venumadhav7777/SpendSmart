// // src/routes/transactionRoutes.js
// const express = require('express');
// const router = express.Router();
// const { getTransactions, refreshTransactions, syncTransactions } = require('../controllers/transactionController');
// // const { protect } = require('../middlewares/authMiddleware');

// // router.post('/fetch', protect, transactionController.getTransactions);
// // router.post('/sync', protect, transactionController.syncTransactions);

// router.get('/fetch', getTransactions);
// router.get('/refresh', refreshTransactions)
// router.get('/sync', syncTransactions);

// module.exports = router;



// routes/transactions.js
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

router.post('/public_token', protect, createPublicToken);
router.post('/exchange_token', protect, exchangeToken);
router.post('/get', protect, getTransactions);
router.post('/sync', protect, syncTransactions);
router.post('/refresh', protect, refreshTransactions);

module.exports = router;
