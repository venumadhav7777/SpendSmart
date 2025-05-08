const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const expenseController = require('../controllers/expenseController');

router.use(protect);

router.post('/', expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
