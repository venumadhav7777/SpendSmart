const express = require('express');
const { findUserById } = require('../controllers/userController');
const { protect, verifyServiceKey } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/profile', verifyServiceKey || protect, findUserById)

module.exports = router;
