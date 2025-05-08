// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("Decoded token:", decoded);
      // Instead of fetching full user from DB immediately, 
      // you can trust the token for lightweight auth
      req.user = {
        id: decoded.id,
        role: decoded.role,
      };
      console.log("User:", req.user);
      next();
    } catch (err) {
      console.error('Auth error:', err.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    next();
  };
};

module.exports = { protect, authorize };
