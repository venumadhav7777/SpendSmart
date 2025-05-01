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
  try {
    const response = await axios.get(
      `${process.env.AUTH_SERVICE_URL}/api/users/profile`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("User profile response:", response.data);

    // Attach everything to req.user
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: response.data.user.email,
      token: token
    };

    console.log("User profile:", req.user);

    return next();
  } catch (err) {
    console.error('Failed to fetch user profile:', err.message);
    return res.status(401).json({ message: 'Not authorized, user not found' });
  }
};
