const express = require('express');
const { findUserById, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/profile', protect, findUserById);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
