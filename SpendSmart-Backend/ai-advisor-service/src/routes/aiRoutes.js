const express = require('express');
const router  = express.Router();
const { chatWithAI, loadModel } = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/ai-advisor/chat
router.use(protect);
router.post('/chat', chatWithAI);
router.post('/loadModel', loadModel)
module.exports = router;
