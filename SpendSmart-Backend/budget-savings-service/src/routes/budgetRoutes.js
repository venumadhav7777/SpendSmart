// src/routes/budgetRoutes.js
const express = require('express');
const router = express.Router();
const {
    createBudget,
    getBudgets,
    updateBudget,
    deleteBudget,
    getBudgetSummary
} = require('../controllers/budgetController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.post('', createBudget);
router.get('', getBudgets);
router.put('/:budgetId', updateBudget);
router.delete('/:budgetId', deleteBudget);
router.get('/summary', getBudgetSummary);

module.exports = router;
