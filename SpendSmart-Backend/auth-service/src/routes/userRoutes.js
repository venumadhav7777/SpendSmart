const express = require('express');
const { findUserById } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/profile', protect, findUserById)

module.exports = router;
