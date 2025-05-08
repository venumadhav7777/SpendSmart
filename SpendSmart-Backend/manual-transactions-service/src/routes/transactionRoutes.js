const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const transactionController = require('../controllers/TransactionController');

router.use(protect);

router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/account/:accountId', transactionController.getTransactionsByAccountId);
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);
router.post('/accounts', transactionController.getTransactionsByAccounts);

module.exports = router;
