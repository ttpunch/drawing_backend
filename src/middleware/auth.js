const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Allow admin users to bypass approval check
    if (req.user.role === 'admin') {
      return next();
    }

    // Check approval status for non-admin users
    if (req.user.status !== 'active') {
      return res.status(403).json({ message: 'Account pending approval' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Admin middleware
exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access restricted to admin users' });
    }
    next();
  } catch (error) {
    res.status(403).json({ message: 'Error checking admin status' });
  }
};