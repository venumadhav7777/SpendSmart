// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const axios = require('axios');

exports.protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authorized, no token' });

  const token = header.split(' ')[1];
  console.log("Token:", token);
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }

  // At this point we have decoded.id and decoded.role
  // Now fetch the user’s profile (including email) from Auth Service
  
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    console.log("User profile:", req.user);

    return next();
};
