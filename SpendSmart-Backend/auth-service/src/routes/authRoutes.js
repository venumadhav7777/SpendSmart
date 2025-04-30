// src/routes/auth.js
const express = require('express');
const { register, login } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const User = require('../models/User');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Admin route (only accessible by admin)
router.get('/admin/dashboard', protect, authorize('Admin'), async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
        message: 'Welcome, Admin!',
        user: user,
    });
});

module.exports = router;
