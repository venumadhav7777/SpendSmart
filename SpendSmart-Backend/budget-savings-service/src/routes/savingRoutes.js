const express = require('express');
const router = express.Router();
const {
    createGoal,
    getGoals,
    updateGoal,
    deleteGoal,
    getSavingsProgress,
    allocateSavings
} = require('../controllers/savingsController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('', createGoal); // POST /api/savings
router.get('', getGoals); // GET /api/savings
router.put('/:goalId', updateGoal); // PUT /api/savings/:goalId
router.delete('/:goalId', deleteGoal); // DELETE /api/savings/:goalId
router.get('/progress', getSavingsProgress); // GET /api/savings/progress
router.post('/allocate', allocateSavings); // POST /api/savings/allocate

module.exports = router;
