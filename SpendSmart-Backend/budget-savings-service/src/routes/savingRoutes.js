// src/routes/savingRoutes.js
const express = require('express');
const router = express.Router();
const {
    createGoal,
    getGoals,
    updateGoal,
    deleteGoal,
    getSavingsProgress
} = require('../controllers/savingsController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.post('', createGoal);
router.get('', getGoals);
router.put('/:goalId', updateGoal);
router.delete('/:goalId', deleteGoal);
router.get('/progress', getSavingsProgress);

module.exports = router;
